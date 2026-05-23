import { format, startOfWeek } from 'date-fns'
import { create } from 'zustand'

import { buildRecommendations } from '@/features/analytics/analytics-service'
import { evaluateBadges } from '@/features/gamification/badges'
import { buildLevelProgress } from '@/features/gamification/leveling'
import { getDailyWaterTotal } from '@/features/nutrition/nutrition-utils'
import { loadSnapshot, saveSnapshot } from '@/lib/db'
import { sanitizeImportedSnapshot } from '@/lib/imported-snapshot'
import { createSyncStatus } from '@/services/sync-service'
import { createDefaultSnapshot, refreshCadenceState } from '@/store/default-state'
import type {
  AppSettings,
  AppSnapshot,
  AuditLog,
  CalibrationProfile,
  Goal,
  MealEntry,
  MoodEntry,
  NotificationPreference,
  Profile,
  Quest,
  SleepEntry,
  SyncStatus,
  TrainerAssignment,
  User,
  WaterEntry,
  WeightEntry,
  WorkoutSession,
} from '@/types/models'
import { createId } from '@/lib/utils'

interface RuntimeState {
  initialized: boolean
  syncing: boolean
  cloudUserId?: string
  recommendations: ReturnType<typeof buildRecommendations>
}

interface AppStore extends RuntimeState {
  snapshot: AppSnapshot
  initialize: () => Promise<void>
  replaceSnapshot: (snapshot: AppSnapshot) => Promise<void>
  setCloudUserId: (cloudUserId?: string) => void
  setSyncStatus: (status: SyncStatus) => Promise<void>
  completeOnboarding: (payload: {
    user: Partial<User>
    profile: Partial<Profile>
    goals: Goal[]
    settings: Partial<AppSettings>
  }) => Promise<void>
  updateProfile: (profile: Partial<Profile>) => Promise<void>
  updateGoals: (goals: Goal[]) => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>
  addMealEntry: (entry: MealEntry) => Promise<void>
  addWaterEntry: (entry: WaterEntry) => Promise<void>
  addSleepEntry: (entry: SleepEntry) => Promise<void>
  addWeightEntry: (entry: WeightEntry) => Promise<void>
  addMoodEntry: (entry: MoodEntry) => Promise<void>
  toggleHabit: (habitId: string) => Promise<void>
  toggleFavorite: (exerciseId: string) => Promise<void>
  recordSession: (session: WorkoutSession) => Promise<void>
  setCalibration: (calibration: CalibrationProfile) => Promise<void>
  addTrainerAssignment: (assignment: TrainerAssignment) => Promise<void>
  removeTrainerAssignment: (assignmentId: string) => Promise<void>
  deleteAllData: () => Promise<void>
}

function appendAuditLog(snapshot: AppSnapshot, partial: Omit<AuditLog, 'id' | 'createdAt'>) {
  return [
    {
      id: createId('audit'),
      createdAt: new Date().toISOString(),
      ...partial,
    },
    ...snapshot.auditLogs,
  ].slice(0, 120)
}

function evaluateGoals(snapshot: AppSnapshot) {
  const workoutsThisWeek = snapshot.workoutSessions.filter((session) => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return new Date(session.startedAt) >= weekStart
  }).length
  const hydrationDays = new Set(
    snapshot.waterEntries
      .filter((entry) => entry.amountMl > 0)
      .map((entry) => entry.date)
      .filter((date) => getDailyWaterTotal(snapshot.waterEntries, date) >= snapshot.profile.waterGoalMl),
  ).size

  return snapshot.goals.map((goal) => {
    if (goal.id === 'goal-workouts-week') {
      return {
        ...goal,
        currentValue: workoutsThisWeek,
        completed: workoutsThisWeek >= goal.targetValue,
        updatedAt: new Date().toISOString(),
      }
    }
    if (goal.id === 'goal-hydration') {
      return {
        ...goal,
        currentValue: hydrationDays,
        completed: hydrationDays >= goal.targetValue,
        updatedAt: new Date().toISOString(),
      }
    }
    return goal
  })
}

function evaluateQuests(snapshot: AppSnapshot): Quest[] {
  const today = format(new Date(), 'yyyy-MM-dd')
  const workoutsToday = snapshot.workoutSessions.filter((session) => session.startedAt.startsWith(today)).length
  const waterGoalMet = getDailyWaterTotal(snapshot.waterEntries, today) >= snapshot.profile.waterGoalMl ? 1 : 0
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const workoutsThisWeek = snapshot.workoutSessions.filter((session) => new Date(session.startedAt) >= weekStart).length

  return snapshot.quests.map((quest) => {
    if (quest.id.startsWith('daily-workout-')) {
      return { ...quest, progress: workoutsToday, completed: workoutsToday >= quest.target, updatedAt: new Date().toISOString() }
    }
    if (quest.id.startsWith('daily-hydration-')) {
      return { ...quest, progress: waterGoalMet, completed: waterGoalMet >= quest.target, updatedAt: new Date().toISOString() }
    }
    return { ...quest, progress: workoutsThisWeek, completed: workoutsThisWeek >= quest.target, updatedAt: new Date().toISOString() }
  })
}

async function persistSnapshot(snapshot: AppSnapshot) {
  await saveSnapshot(snapshot)
}

function buildDerivedSnapshot(snapshot: AppSnapshot, previousSnapshot?: AppSnapshot) {
  const cadenceReady = refreshCadenceState(snapshot)
  const next = {
    ...cadenceReady,
    goals: evaluateGoals(cadenceReady),
    quests: evaluateQuests(cadenceReady),
    updatedAt: new Date().toISOString(),
    lastActiveDate: format(new Date(), 'yyyy-MM-dd'),
  }

  const completedQuestIds = next.quests
    .filter((quest) => quest.completed && !previousSnapshot?.quests.find((item) => item.id === quest.id && item.completed))
    .map((quest) => quest.id)
  const questBonus = next.quests
    .filter((quest) => completedQuestIds.includes(quest.id))
    .reduce((sum, quest) => sum + quest.rewardXp, 0)

  const progress = buildLevelProgress(next.workoutSessions, next.levelProgress.xp + questBonus, next.goals)
  next.levelProgress = progress

  const badgeResult = evaluateBadges(next)
  next.badges = badgeResult.badges
  next.achievementHistory = [...next.achievementHistory, ...badgeResult.unlockedHistory]

  if (completedQuestIds.length > 0) {
    next.auditLogs = appendAuditLog(next, {
      action: 'quest-completed',
      entity: 'quest',
      entityId: completedQuestIds.join(','),
      details: `${completedQuestIds.length} quest rewards added to XP.`,
    })
  }

  return next
}

export const useAppStore = create<AppStore>((set, get) => ({
  initialized: false,
  syncing: false,
  snapshot: createDefaultSnapshot(),
  recommendations: [],

  async initialize() {
    if (get().initialized) return
    const stored = await loadSnapshot()
    const snapshot = stored?.snapshot ? sanitizeImportedSnapshot(stored.snapshot) : createDefaultSnapshot()
    const derived = buildDerivedSnapshot(snapshot)
    await persistSnapshot(derived)
    set({ snapshot: derived, initialized: true, recommendations: buildRecommendations(derived) })
  },

  async replaceSnapshot(snapshot) {
    const derived = buildDerivedSnapshot(snapshot, get().snapshot)
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  setCloudUserId(cloudUserId) {
    set({ cloudUserId })
  },

  async setSyncStatus(status) {
    const current = refreshCadenceState(get().snapshot)
    const snapshot = { ...current, syncStatus: status }
    await persistSnapshot(snapshot)
    set({ snapshot })
  },

  async completeOnboarding(payload) {
    const current = refreshCadenceState(get().snapshot)
    const updated: AppSnapshot = {
      ...current,
      user: {
        ...current.user,
        ...payload.user,
        displayName: payload.user.displayName ?? payload.profile.name ?? current.user.displayName,
        updatedAt: new Date().toISOString(),
      },
      profile: {
        ...current.profile,
        ...payload.profile,
        userId: payload.user.id ?? current.profile.userId,
        updatedAt: new Date().toISOString(),
      },
      goals: payload.goals,
      settings: {
        ...current.settings,
        ...payload.settings,
        updatedAt: new Date().toISOString(),
        reminders: {
          ...current.settings.reminders,
          ...payload.settings.reminders,
          updatedAt: new Date().toISOString(),
        },
      },
      onboardingCompleted: true,
      syncStatus: createSyncStatus('idle', payload.user.authMode === 'google' ? 'firebase' : 'local'),
    }
    const derived = buildDerivedSnapshot(updated, current)
    derived.auditLogs = appendAuditLog(derived, {
      action: 'onboarding-complete',
      entity: 'profile',
      entityId: derived.profile.id,
      details: 'Initial profile, goals, and preferences configured.',
    })
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async updateProfile(profile) {
    const current = get().snapshot
    const derived = buildDerivedSnapshot(
      {
        ...current,
        profile: { ...current.profile, ...profile, updatedAt: new Date().toISOString() },
        auditLogs: appendAuditLog(current, {
          action: 'profile-update',
          entity: 'profile',
          entityId: current.profile.id,
          details: 'Profile settings updated.',
        }),
      },
      current,
    )
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async updateGoals(goals) {
    const current = get().snapshot
    const derived = buildDerivedSnapshot(
      {
        ...current,
        goals,
        auditLogs: appendAuditLog(current, {
          action: 'goal-update',
          entity: 'goal',
          entityId: goals.map((goal) => goal.id).join(','),
          details: 'Goals were updated.',
        }),
      },
      current,
    )
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async updateSettings(settings) {
    const current = refreshCadenceState(get().snapshot)
    const nextSettings = {
      ...current.settings,
      ...settings,
      reminders: {
        ...current.settings.reminders,
        ...(settings.reminders as Partial<NotificationPreference> | undefined),
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    }
    const snapshot = { ...current, settings: nextSettings }
    await persistSnapshot(snapshot)
    set({ snapshot })
  },

  async addMealEntry(entry) {
    const current = get().snapshot
    const derived = buildDerivedSnapshot(
      {
        ...current,
        mealEntries: [entry, ...current.mealEntries],
        auditLogs: appendAuditLog(current, {
          action: 'meal-log',
          entity: 'meal',
          entityId: entry.id,
          details: `${entry.title} logged with ${entry.calories} kcal.`,
        }),
      },
      current,
    )
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async addWaterEntry(entry) {
    const current = get().snapshot
    const derived = buildDerivedSnapshot(
      {
        ...current,
        waterEntries: [entry, ...current.waterEntries],
      },
      current,
    )
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async addSleepEntry(entry) {
    const current = get().snapshot
    const derived = buildDerivedSnapshot(
      {
        ...current,
        sleepEntries: [entry, ...current.sleepEntries.filter((item) => item.date !== entry.date)],
      },
      current,
    )
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async addWeightEntry(entry) {
    const current = get().snapshot
    const derived = buildDerivedSnapshot(
      {
        ...current,
        weightEntries: [entry, ...current.weightEntries.filter((item) => item.date !== entry.date)],
      },
      current,
    )
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async addMoodEntry(entry) {
    const current = get().snapshot
    const derived = buildDerivedSnapshot(
      {
        ...current,
        moodEntries: [entry, ...current.moodEntries.filter((item) => item.date !== entry.date)],
      },
      current,
    )
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async toggleHabit(habitId) {
    const current = refreshCadenceState(get().snapshot)
    const habitEntries = current.habitEntries.map((habit) =>
      habit.id === habitId ? { ...habit, completed: !habit.completed, updatedAt: new Date().toISOString() } : habit,
    )
    const snapshot = { ...current, habitEntries }
    await persistSnapshot(snapshot)
    set({ snapshot })
  },

  async toggleFavorite(exerciseId) {
    const current = refreshCadenceState(get().snapshot)
    const favorites = current.favorites.includes(exerciseId)
      ? current.favorites.filter((item) => item !== exerciseId)
      : [exerciseId, ...current.favorites]
    const snapshot = { ...current, favorites }
    await persistSnapshot(snapshot)
    set({ snapshot })
  },

  async recordSession(session) {
    const current = get().snapshot
    const existing = current.workoutSessions.find((item) => item.id === session.id)
    const workoutSessions = existing
      ? current.workoutSessions.map((item) => (item.id === session.id ? session : item))
      : [session, ...current.workoutSessions]
    const recentExerciseIds = [session.exerciseId, ...current.recentExerciseIds.filter((item) => item !== session.exerciseId)].slice(0, 10)
    const derived = buildDerivedSnapshot(
      {
        ...current,
        workoutSessions,
        recentExerciseIds,
        levelProgress: {
          ...current.levelProgress,
          xp: current.levelProgress.xp + session.xpGained,
          lifetimeXp: current.levelProgress.lifetimeXp + session.xpGained,
          updatedAt: new Date().toISOString(),
        },
        auditLogs: appendAuditLog(current, {
          action: 'workout-complete',
          entity: 'session',
          entityId: session.id,
          details: `${session.exerciseId} session completed with ${session.averageFormScore} average form and ${session.xpGained} XP.`,
        }),
      },
      current,
    )
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async setCalibration(calibration) {
    const current = refreshCadenceState(get().snapshot)
    const snapshot = { ...current, calibration }
    await persistSnapshot(snapshot)
    set({ snapshot })
  },

  async addTrainerAssignment(assignment) {
    const current = get().snapshot
    const derived = buildDerivedSnapshot(
      {
        ...current,
        trainerAssignments: [assignment, ...current.trainerAssignments],
      },
      current,
    )
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async removeTrainerAssignment(assignmentId) {
    const current = refreshCadenceState(get().snapshot)
    const derived = buildDerivedSnapshot(
      {
        ...current,
        trainerAssignments: current.trainerAssignments.filter((assignment) => assignment.id !== assignmentId),
      },
      current,
    )
    await persistSnapshot(derived)
    set({ snapshot: derived, recommendations: buildRecommendations(derived) })
  },

  async deleteAllData() {
    const snapshot = createDefaultSnapshot()
    await persistSnapshot(snapshot)
    set({ snapshot, recommendations: buildRecommendations(snapshot) })
  },
}))

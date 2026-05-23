import { format, startOfWeek } from 'date-fns'

import { exerciseCatalog } from '@/features/workouts/exercises'
import { workoutPlans } from '@/features/workouts/workout-plans'
import type { AppSettings, AppSnapshot, Badge, Goal, HabitEntry, Profile, Quest, User } from '@/types/models'

const defaultHabitNames = ['10-minute walk', 'Breathing reset']

function nowIso(referenceDate = new Date()) {
  return referenceDate.toISOString()
}

function dayKey(referenceDate = new Date()) {
  return format(referenceDate, 'yyyy-MM-dd')
}

function weekKey(referenceDate = new Date()) {
  return format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

function buildHabitId(name: string, date: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `habit-${slug}-${date}`
}

export function createDefaultUser(referenceDate = new Date()): User {
  const now = nowIso(referenceDate)
  return {
    id: 'guest-user',
    displayName: 'Guest Athlete',
    authMode: 'guest',
    role: 'member',
    createdAt: now,
    updatedAt: now,
  }
}

export function createDefaultProfile(userId: string, referenceDate = new Date()): Profile {
  const now = nowIso(referenceDate)
  return {
    id: 'profile-main',
    userId,
    name: 'Guest Athlete',
    age: 28,
    gender: 'Prefer not to say',
    heightCm: 170,
    weightKg: 70,
    targetWeightKg: 68,
    dailyCalorieTarget: 2200,
    waterGoalMl: 2600,
    stepGoal: 8000,
    goalType: 'wellness',
    experienceLevel: 'Beginner',
    preferredWorkoutStyle: 'Balanced',
    notificationOptIn: true,
    privacyMode: {
      storeLandmarksOnly: true,
      allowCloudSync: true,
      allowCameraSnapshots: false,
    },
    createdAt: now,
    updatedAt: now,
  }
}

export function createDefaultGoals(referenceDate = new Date()): Goal[] {
  const now = nowIso(referenceDate)
  return [
    {
      id: 'goal-workouts-week',
      title: 'Complete 4 workouts per week',
      type: 'wellness',
      targetValue: 4,
      unit: 'workouts/week',
      currentValue: 0,
      completed: false,
      updatedAt: now,
      createdAt: now,
    },
    {
      id: 'goal-hydration',
      title: 'Hit hydration goal five days this week',
      type: 'wellness',
      targetValue: 5,
      unit: 'days',
      currentValue: 0,
      completed: false,
      updatedAt: now,
      createdAt: now,
    },
  ]
}

export function createDefaultBadges(): Badge[] {
  return []
}

export function createDefaultQuests(referenceDate = new Date()): Quest[] {
  const now = nowIso(referenceDate)
  const today = dayKey(referenceDate)
  const activeWeek = weekKey(referenceDate)
  return [
    {
      id: `daily-workout-${today}`,
      title: 'Daily Momentum',
      description: 'Complete one workout today.',
      target: 1,
      progress: 0,
      rewardXp: 60,
      cadence: 'daily',
      completed: false,
      updatedAt: now,
    },
    {
      id: `daily-hydration-${today}`,
      title: 'Hydration Flow',
      description: 'Reach your water goal today.',
      target: 1,
      progress: 0,
      rewardXp: 40,
      cadence: 'daily',
      completed: false,
      updatedAt: now,
    },
    {
      id: `weekly-consistency-${activeWeek}`,
      title: 'Weekly Champion',
      description: 'Complete four workouts this week.',
      target: 4,
      progress: 0,
      rewardXp: 180,
      cadence: 'weekly',
      completed: false,
      updatedAt: now,
    },
  ]
}

export function createDailyHabitEntries(referenceDate = new Date(), existingEntries: HabitEntry[] = []) {
  const now = nowIso(referenceDate)
  const today = dayKey(referenceDate)
  const existingByName = new Map(
    existingEntries
      .filter((entry) => entry.date === today)
      .map((entry) => [entry.name, entry]),
  )

  return defaultHabitNames.map((name) => {
    const existing = existingByName.get(name)
    if (existing) {
      return {
        ...existing,
        date: today,
      }
    }

    return {
      id: buildHabitId(name, today),
      date: today,
      name,
      completed: false,
      updatedAt: now,
    }
  })
}

export function createDefaultSettings(referenceDate = new Date()): AppSettings {
  const now = nowIso(referenceDate)
  return {
    theme: 'system',
    cameraMirrored: true,
    speech: {
      enabled: true,
      rate: 1,
      pitch: 1,
      minIntervalMs: 6500,
    },
    reminders: {
      workoutReminder: '18:30',
      hydrationReminderIntervalMin: 90,
      mealReminderTimes: ['08:00', '13:00', '19:00'],
      weeklySummaryDay: 0,
      recoveryPromptEnabled: true,
      browserNotificationsEnabled: false,
      updatedAt: now,
    },
    units: 'metric',
    showAdvancedAnalytics: false,
    updatedAt: now,
  }
}

export function refreshCadenceState(snapshot: AppSnapshot, referenceDate = new Date()): AppSnapshot {
  return {
    ...snapshot,
    quests: createDefaultQuests(referenceDate),
    habitEntries: createDailyHabitEntries(referenceDate, snapshot.habitEntries),
    lastActiveDate: dayKey(referenceDate),
  }
}

export function createDefaultSnapshot(referenceDate = new Date()): AppSnapshot {
  const now = nowIso(referenceDate)
  const today = dayKey(referenceDate)
  const user = createDefaultUser(referenceDate)

  return {
    schemaVersion: 1,
    user,
    profile: createDefaultProfile(user.id, referenceDate),
    goals: createDefaultGoals(referenceDate),
    exercises: exerciseCatalog,
    workoutPlans,
    workoutSessions: [],
    mealEntries: [],
    waterEntries: [],
    sleepEntries: [],
    weightEntries: [
      {
        id: 'weight-start',
        date: today,
        weightKg: 70,
        updatedAt: now,
      },
    ],
    moodEntries: [],
    habitEntries: createDailyHabitEntries(referenceDate),
    badges: createDefaultBadges(),
    achievementHistory: [],
    quests: createDefaultQuests(referenceDate),
    levelProgress: {
      currentLevel: 'Beginner',
      xp: 0,
      xpToNextLevel: 750,
      lifetimeXp: 0,
      longestStreak: 0,
      currentStreak: 0,
      averageFormScore: 0,
      completedGoals: 0,
      milestoneHistory: ['Beginner unlocked at 0 XP'],
      updatedAt: now,
    },
    settings: createDefaultSettings(referenceDate),
    syncStatus: {
      state: 'idle',
      provider: 'local',
      pendingChanges: 0,
      updatedAt: now,
    },
    auditLogs: [],
    trainerAssignments: [],
    favorites: [],
    recentExerciseIds: [],
    onboardingCompleted: false,
    lastActiveDate: today,
    updatedAt: now,
  }
}

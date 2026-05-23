import { exerciseCatalog } from '@/features/workouts/exercises'
import { workoutPlans } from '@/features/workouts/workout-plans'
import { createDefaultSnapshot, refreshCadenceState } from '@/store/default-state'
import type { AppSnapshot } from '@/types/models'

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function readStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

function readEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback
}

function mapArray<T>(value: unknown, mapper: (item: JsonRecord) => T | null) {
  if (!Array.isArray(value)) return [] as T[]
  return value
    .map((item) => (isRecord(item) ? mapper(item) : null))
    .filter((item): item is T => item !== null)
}

function unwrapSnapshot(input: unknown) {
  if (!isRecord(input)) {
    throw new Error('Backup file must contain a JSON object.')
  }

  if (isRecord(input.snapshot)) {
    return input.snapshot
  }

  return input
}

export function sanitizeImportedSnapshot(input: unknown): AppSnapshot {
  const raw = unwrapSnapshot(input)
  const base = createDefaultSnapshot()

  const user = isRecord(raw.user)
    ? {
        ...base.user,
        id: readString(raw.user.id, base.user.id),
        email: readOptionalString(raw.user.email),
        displayName: readString(raw.user.displayName, base.user.displayName),
        authMode: readEnum(raw.user.authMode, ['guest', 'google'], base.user.authMode),
        photoUrl: readOptionalString(raw.user.photoUrl),
        role: readEnum(raw.user.role, ['member', 'trainer', 'admin'], base.user.role),
        createdAt: readString(raw.user.createdAt, base.user.createdAt),
        updatedAt: readString(raw.user.updatedAt, base.user.updatedAt),
      }
    : base.user

  const profile = isRecord(raw.profile)
    ? {
        ...base.profile,
        id: readString(raw.profile.id, base.profile.id),
        userId: readString(raw.profile.userId, user.id),
        name: readString(raw.profile.name, base.profile.name),
        avatar: readOptionalString(raw.profile.avatar),
        age: readNumber(raw.profile.age, base.profile.age),
        gender: readString(raw.profile.gender, base.profile.gender),
        heightCm: readNumber(raw.profile.heightCm, base.profile.heightCm),
        weightKg: readNumber(raw.profile.weightKg, base.profile.weightKg),
        targetWeightKg: readNumber(raw.profile.targetWeightKg, base.profile.targetWeightKg),
        dailyCalorieTarget: readNumber(raw.profile.dailyCalorieTarget, base.profile.dailyCalorieTarget),
        waterGoalMl: readNumber(raw.profile.waterGoalMl, base.profile.waterGoalMl),
        stepGoal: readNumber(raw.profile.stepGoal, base.profile.stepGoal),
        goalType: readEnum(raw.profile.goalType, ['fat_loss', 'muscle_gain', 'performance', 'mobility', 'wellness'], base.profile.goalType),
        experienceLevel: readEnum(raw.profile.experienceLevel, ['Beginner', 'Intermediate', 'Pro', 'Athlete'], base.profile.experienceLevel),
        preferredWorkoutStyle: readString(raw.profile.preferredWorkoutStyle, base.profile.preferredWorkoutStyle),
        notificationOptIn: readBoolean(raw.profile.notificationOptIn, base.profile.notificationOptIn),
        privacyMode: isRecord(raw.profile.privacyMode)
          ? {
              storeLandmarksOnly: readBoolean(raw.profile.privacyMode.storeLandmarksOnly, base.profile.privacyMode.storeLandmarksOnly),
              allowCloudSync: readBoolean(raw.profile.privacyMode.allowCloudSync, base.profile.privacyMode.allowCloudSync),
              allowCameraSnapshots: readBoolean(raw.profile.privacyMode.allowCameraSnapshots, base.profile.privacyMode.allowCameraSnapshots),
            }
          : base.profile.privacyMode,
        createdAt: readString(raw.profile.createdAt, base.profile.createdAt),
        updatedAt: readString(raw.profile.updatedAt, base.profile.updatedAt),
      }
    : base.profile

  const snapshot: AppSnapshot = {
    ...base,
    schemaVersion: readNumber(raw.schemaVersion, base.schemaVersion),
    user,
    profile: {
      ...profile,
      userId: user.id,
    },
    goals:
      mapArray(raw.goals, (item) => ({
        id: readString(item.id, ''),
        title: readString(item.title, ''),
        type: readEnum(item.type, ['fat_loss', 'muscle_gain', 'performance', 'mobility', 'wellness'], 'wellness'),
        targetValue: readNumber(item.targetValue, 0),
        unit: readString(item.unit, ''),
        currentValue: readNumber(item.currentValue, 0),
        dueDate: readOptionalString(item.dueDate),
        completed: readBoolean(item.completed, false),
        createdAt: readString(item.createdAt, base.updatedAt),
        updatedAt: readString(item.updatedAt, base.updatedAt),
      })).filter((goal) => goal.id && goal.title) || base.goals,
    exercises: exerciseCatalog,
    workoutPlans,
    workoutSessions: mapArray(raw.workoutSessions, (item) => ({
      id: readString(item.id, ''),
      planId: readOptionalString(item.planId),
      exerciseId: readString(item.exerciseId, ''),
      startedAt: readString(item.startedAt, base.updatedAt),
      completedAt: readOptionalString(item.completedAt),
      durationSeconds: readNumber(item.durationSeconds, 0),
      repsCompleted: readNumber(item.repsCompleted, 0),
      caloriesBurned: readNumber(item.caloriesBurned, 0),
      averageFormScore: readNumber(item.averageFormScore, 0),
      accuracyTrend: Array.isArray(item.accuracyTrend) ? item.accuracyTrend.filter((value): value is number => typeof value === 'number' && Number.isFinite(value)) : [],
      repEvents: mapArray(item.repEvents, (rep) => ({
        id: readString(rep.id, ''),
        repNumber: readNumber(rep.repNumber, 0),
        exerciseId: readString(rep.exerciseId, ''),
        timestamp: readString(rep.timestamp, base.updatedAt),
        phase: readEnum(rep.phase, ['up', 'down', 'hold', 'open', 'closed'], 'down'),
        score: readNumber(rep.score, 0),
      })).filter((rep) => rep.id && rep.exerciseId),
      formEvents: mapArray(item.formEvents, (event) => ({
        id: readString(event.id, ''),
        timestamp: readString(event.timestamp, base.updatedAt),
        exerciseId: readString(event.exerciseId, ''),
        code: readString(event.code, ''),
        message: readString(event.message, ''),
        severity: readEnum(event.severity, ['info', 'warning', 'critical'], 'info'),
        scoreImpact: readNumber(event.scoreImpact, 0),
      })).filter((event) => event.id && event.exerciseId && event.code),
      recommendations: readStringArray(item.recommendations, []),
      xpGained: readNumber(item.xpGained, 0),
      notes: readOptionalString(item.notes),
      updatedAt: readString(item.updatedAt, base.updatedAt),
    })).filter((session) => session.id && session.exerciseId),
    mealEntries: mapArray(raw.mealEntries, (item) => ({
      id: readString(item.id, ''),
      date: readString(item.date, ''),
      mealType: readEnum(item.mealType, ['breakfast', 'lunch', 'dinner', 'snack'], 'breakfast'),
      title: readString(item.title, ''),
      calories: readNumber(item.calories, 0),
      protein: readNumber(item.protein, 0),
      carbs: readNumber(item.carbs, 0),
      fats: readNumber(item.fats, 0),
      notes: readOptionalString(item.notes),
      photoDataUrl: readOptionalString(item.photoDataUrl),
      updatedAt: readString(item.updatedAt, base.updatedAt),
    })).filter((entry) => entry.id && entry.date && entry.title),
    waterEntries: mapArray(raw.waterEntries, (item) => ({
      id: readString(item.id, ''),
      date: readString(item.date, ''),
      amountMl: readNumber(item.amountMl, 0),
      updatedAt: readString(item.updatedAt, base.updatedAt),
    })).filter((entry) => entry.id && entry.date),
    sleepEntries: mapArray(raw.sleepEntries, (item) => ({
      id: readString(item.id, ''),
      date: readString(item.date, ''),
      durationHours: readNumber(item.durationHours, 0),
      quality: readNumber(item.quality, 0),
      updatedAt: readString(item.updatedAt, base.updatedAt),
    })).filter((entry) => entry.id && entry.date),
    weightEntries: mapArray(raw.weightEntries, (item) => ({
      id: readString(item.id, ''),
      date: readString(item.date, ''),
      weightKg: readNumber(item.weightKg, 0),
      updatedAt: readString(item.updatedAt, base.updatedAt),
    })).filter((entry) => entry.id && entry.date),
    moodEntries: mapArray(raw.moodEntries, (item) => ({
      id: readString(item.id, ''),
      date: readString(item.date, ''),
      mood: readNumber(item.mood, 0),
      energy: readNumber(item.energy, 0),
      notes: readOptionalString(item.notes),
      updatedAt: readString(item.updatedAt, base.updatedAt),
    })).filter((entry) => entry.id && entry.date),
    badges: mapArray(raw.badges, (item) => ({
      id: readString(item.id, ''),
      name: readString(item.name, ''),
      description: readString(item.description, ''),
      icon: readString(item.icon, ''),
      criteria: readString(item.criteria, ''),
      unlocked: readBoolean(item.unlocked, false),
      unlockedAt: readOptionalString(item.unlockedAt),
      updatedAt: readString(item.updatedAt, base.updatedAt),
    })).filter((badge) => badge.id && badge.name),
    achievementHistory: mapArray(raw.achievementHistory, (item) => ({
      id: readString(item.id, ''),
      badgeId: readString(item.badgeId, ''),
      earnedAt: readString(item.earnedAt, base.updatedAt),
      source: readString(item.source, ''),
    })).filter((entry) => entry.id && entry.badgeId),
    settings: isRecord(raw.settings)
      ? {
          ...base.settings,
          theme: readEnum(raw.settings.theme, ['light', 'dark', 'system'], base.settings.theme),
          cameraMirrored: readBoolean(raw.settings.cameraMirrored, base.settings.cameraMirrored),
          selectedVoice: readOptionalString(raw.settings.selectedVoice),
          speech: isRecord(raw.settings.speech)
            ? {
                enabled: readBoolean(raw.settings.speech.enabled, base.settings.speech.enabled),
                name: readOptionalString(raw.settings.speech.name),
                rate: readNumber(raw.settings.speech.rate, base.settings.speech.rate),
                pitch: readNumber(raw.settings.speech.pitch, base.settings.speech.pitch),
                minIntervalMs: readNumber(raw.settings.speech.minIntervalMs, base.settings.speech.minIntervalMs),
              }
            : base.settings.speech,
          reminders: isRecord(raw.settings.reminders)
            ? {
                workoutReminder: readString(raw.settings.reminders.workoutReminder, base.settings.reminders.workoutReminder),
                hydrationReminderIntervalMin: readNumber(
                  raw.settings.reminders.hydrationReminderIntervalMin,
                  base.settings.reminders.hydrationReminderIntervalMin,
                ),
                mealReminderTimes: readStringArray(raw.settings.reminders.mealReminderTimes, base.settings.reminders.mealReminderTimes),
                weeklySummaryDay: readNumber(raw.settings.reminders.weeklySummaryDay, base.settings.reminders.weeklySummaryDay),
                recoveryPromptEnabled: readBoolean(
                  raw.settings.reminders.recoveryPromptEnabled,
                  base.settings.reminders.recoveryPromptEnabled,
                ),
                browserNotificationsEnabled: readBoolean(
                  raw.settings.reminders.browserNotificationsEnabled,
                  base.settings.reminders.browserNotificationsEnabled,
                ),
                updatedAt: readString(raw.settings.reminders.updatedAt, base.settings.reminders.updatedAt),
              }
            : base.settings.reminders,
          units: readEnum(raw.settings.units, ['metric', 'imperial'], base.settings.units),
          showAdvancedAnalytics: readBoolean(raw.settings.showAdvancedAnalytics, base.settings.showAdvancedAnalytics),
          updatedAt: readString(raw.settings.updatedAt, base.settings.updatedAt),
        }
      : base.settings,
    syncStatus: isRecord(raw.syncStatus)
      ? {
          state: readEnum(raw.syncStatus.state, ['idle', 'syncing', 'success', 'error', 'offline'], base.syncStatus.state),
          provider: readEnum(raw.syncStatus.provider, ['local', 'firebase'], base.syncStatus.provider),
          lastSyncedAt: readOptionalString(raw.syncStatus.lastSyncedAt),
          lastError: readOptionalString(raw.syncStatus.lastError),
          pendingChanges: readNumber(raw.syncStatus.pendingChanges, base.syncStatus.pendingChanges),
          updatedAt: readString(raw.syncStatus.updatedAt, base.syncStatus.updatedAt),
        }
      : base.syncStatus,
    auditLogs: mapArray(raw.auditLogs, (item) => ({
      id: readString(item.id, ''),
      action: readString(item.action, ''),
      entity: readString(item.entity, ''),
      entityId: readString(item.entityId, ''),
      details: readString(item.details, ''),
      createdAt: readString(item.createdAt, base.updatedAt),
    })).filter((item) => item.id && item.action && item.entityId),
    trainerAssignments: mapArray(raw.trainerAssignments, (item) => ({
      id: readString(item.id, ''),
      planId: readString(item.planId, ''),
      assigneeName: readString(item.assigneeName, ''),
      notes: readString(item.notes, ''),
      createdAt: readString(item.createdAt, base.updatedAt),
      updatedAt: readString(item.updatedAt, base.updatedAt),
    })).filter((item) => item.id && item.planId && item.assigneeName),
    favorites: readStringArray(raw.favorites, []),
    recentExerciseIds: readStringArray(raw.recentExerciseIds, []).slice(0, 10),
    calibration: isRecord(raw.calibration)
      ? {
          baselineShoulderWidth: readNumber(raw.calibration.baselineShoulderWidth, 0),
          baselineHipWidth: readNumber(raw.calibration.baselineHipWidth, 0),
          framingScore: readNumber(raw.calibration.framingScore, 0),
          completedAt: readString(raw.calibration.completedAt, base.updatedAt),
        }
      : undefined,
    onboardingCompleted: readBoolean(raw.onboardingCompleted, base.onboardingCompleted),
    lastActiveDate: readString(raw.lastActiveDate, base.lastActiveDate),
    updatedAt: readString(raw.updatedAt, base.updatedAt),
  }

  snapshot.goals = snapshot.goals.length > 0 ? snapshot.goals : base.goals
  return refreshCadenceState(snapshot)
}

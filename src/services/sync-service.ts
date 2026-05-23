import { isAfter } from 'date-fns'

import type { AppSnapshot, AuditLog, CalibrationProfile, SyncStatus, AchievementHistory } from '@/types/models'

function pickLatest<T extends { updatedAt: string }>(left: T, right: T) {
  return isAfter(new Date(left.updatedAt), new Date(right.updatedAt)) ? left : right
}

function mergeById<T extends { id: string; updatedAt: string }>(local: T[], remote: T[]) {
  const merged = new Map<string, T>()
  for (const item of [...local, ...remote]) {
    const existing = merged.get(item.id)
    merged.set(item.id, existing ? pickLatest(existing, item) : item)
  }
  return [...merged.values()]
}

function mergeAchievementHistory(local: AchievementHistory[], remote: AchievementHistory[]) {
  const merged = new Map<string, AchievementHistory>()
  for (const item of [...local, ...remote]) {
    const existing = merged.get(item.id)
    if (!existing || isAfter(new Date(item.earnedAt), new Date(existing.earnedAt))) {
      merged.set(item.id, item)
    }
  }
  return [...merged.values()]
}

function mergeAuditLogs(local: AuditLog[], remote: AuditLog[]) {
  const merged = new Map<string, AuditLog>()
  for (const item of [...local, ...remote]) {
    const existing = merged.get(item.id)
    if (!existing || isAfter(new Date(item.createdAt), new Date(existing.createdAt))) {
      merged.set(item.id, item)
    }
  }
  return [...merged.values()]
}

function mergeCalibration(local?: CalibrationProfile, remote?: CalibrationProfile) {
  if (!local) return remote
  if (!remote) return local
  return isAfter(new Date(local.completedAt), new Date(remote.completedAt)) ? local : remote
}

export function mergeSnapshots(local: AppSnapshot, remote: AppSnapshot) {
  return {
    ...pickLatest(local, remote),
    user: pickLatest(local.user, remote.user),
    profile: pickLatest(local.profile, remote.profile),
    goals: mergeById(local.goals, remote.goals),
    exercises: mergeById(local.exercises, remote.exercises),
    workoutPlans: mergeById(local.workoutPlans, remote.workoutPlans),
    workoutSessions: mergeById(local.workoutSessions, remote.workoutSessions),
    mealEntries: mergeById(local.mealEntries, remote.mealEntries),
    waterEntries: mergeById(local.waterEntries, remote.waterEntries),
    sleepEntries: mergeById(local.sleepEntries, remote.sleepEntries),
    weightEntries: mergeById(local.weightEntries, remote.weightEntries),
    moodEntries: mergeById(local.moodEntries, remote.moodEntries),
    habitEntries: mergeById(local.habitEntries, remote.habitEntries),
    badges: mergeById(local.badges, remote.badges),
    achievementHistory: mergeAchievementHistory(local.achievementHistory, remote.achievementHistory),
    quests: mergeById(local.quests, remote.quests),
    auditLogs: mergeAuditLogs(local.auditLogs, remote.auditLogs),
    trainerAssignments: mergeById(local.trainerAssignments, remote.trainerAssignments),
    settings: pickLatest(local.settings, remote.settings),
    levelProgress: pickLatest(local.levelProgress, remote.levelProgress),
    syncStatus: local.syncStatus,
    favorites: [...new Set([...local.favorites, ...remote.favorites])],
    recentExerciseIds: [...new Set([...remote.recentExerciseIds, ...local.recentExerciseIds])].slice(0, 12),
    calibration: mergeCalibration(local.calibration, remote.calibration),
    onboardingCompleted: local.onboardingCompleted || remote.onboardingCompleted,
    lastActiveDate: pickLatest(
      { updatedAt: local.lastActiveDate, value: local.lastActiveDate },
      { updatedAt: remote.lastActiveDate, value: remote.lastActiveDate },
    ).value,
    updatedAt: new Date().toISOString(),
  }
}

export function createSyncStatus(state: SyncStatus['state'], provider: SyncStatus['provider'], partial?: Partial<SyncStatus>): SyncStatus {
  return {
    state,
    provider,
    pendingChanges: partial?.pendingChanges ?? 0,
    lastError: partial?.lastError,
    lastSyncedAt: partial?.lastSyncedAt,
    updatedAt: new Date().toISOString(),
  }
}

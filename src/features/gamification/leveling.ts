import { differenceInCalendarDays, formatISO, startOfDay } from 'date-fns'

import type { ExperienceLevel, Goal, LevelProgress, LevelUnlock, WorkoutSession } from '@/types/models'
import { average } from '@/lib/utils'

export const levelUnlocks: LevelUnlock[] = [
  {
    title: 'Beginner',
    minXp: 0,
    minStreak: 0,
    minAverageFormScore: 0,
    minGoalsCompleted: 0,
    features: ['Foundation plans', 'Basic analytics', 'Live coaching'],
  },
  {
    title: 'Intermediate',
    minXp: 750,
    minStreak: 5,
    minAverageFormScore: 70,
    minGoalsCompleted: 1,
    features: ['Fat loss plans', 'Expanded quests', 'Advanced reminders'],
  },
  {
    title: 'Pro',
    minXp: 1800,
    minStreak: 12,
    minAverageFormScore: 82,
    minGoalsCompleted: 2,
    features: ['Muscle gain plans', 'Coach insights', 'Strict form thresholds'],
  },
  {
    title: 'Athlete',
    minXp: 3200,
    minStreak: 21,
    minAverageFormScore: 90,
    minGoalsCompleted: 4,
    features: ['Athlete analytics', 'Gym split plans', 'Mastery perks and elite badges'],
  },
]

export function calculateWorkoutXp(session: Pick<WorkoutSession, 'durationSeconds' | 'averageFormScore' | 'repsCompleted' | 'caloriesBurned'>) {
  const durationBonus = Math.round(session.durationSeconds / 30)
  const formBonus = Math.round(session.averageFormScore * 2.2)
  const repBonus = Math.round(session.repsCompleted * 1.5)
  const calorieBonus = Math.round(session.caloriesBurned * 0.6)
  return durationBonus + formBonus + repBonus + calorieBonus
}

export function calculateStreak(sessionDates: string[]) {
  const uniqueDays = [...new Set(sessionDates.map((entry) => formatISO(startOfDay(new Date(entry)), { representation: 'date' })))].sort()
  if (uniqueDays.length === 0) return 0

  let streak = 1
  for (let index = uniqueDays.length - 1; index > 0; index -= 1) {
    const current = new Date(uniqueDays[index])
    const previous = new Date(uniqueDays[index - 1])
    if (differenceInCalendarDays(current, previous) === 1) {
      streak += 1
    } else if (differenceInCalendarDays(current, previous) > 1) {
      break
    }
  }

  const today = startOfDay(new Date())
  const last = startOfDay(new Date(uniqueDays.at(-1)!))
  if (differenceInCalendarDays(today, last) > 1) {
    return 0
  }
  return streak
}

export function calculateLongestStreak(sessionDates: string[]) {
  const uniqueDays = [...new Set(sessionDates.map((entry) => formatISO(startOfDay(new Date(entry)), { representation: 'date' })))].sort()
  if (uniqueDays.length === 0) return 0
  let best = 1
  let current = 1

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const diff = differenceInCalendarDays(new Date(uniqueDays[index]), new Date(uniqueDays[index - 1]))
    if (diff === 1) {
      current += 1
      best = Math.max(best, current)
    } else if (diff > 1) {
      current = 1
    }
  }

  return best
}

export function determineLevel(xp: number, streak: number, averageFormScore: number, completedGoals: number) {
  const unlock = [...levelUnlocks]
    .reverse()
    .find(
      (item) =>
        xp >= item.minXp &&
        streak >= item.minStreak &&
        averageFormScore >= item.minAverageFormScore &&
        completedGoals >= item.minGoalsCompleted,
    ) ?? levelUnlocks[0]

  return unlock.title
}

export function buildLevelProgress(workoutSessions: WorkoutSession[], previousXp: number, goals: Goal[]): LevelProgress {
  const currentStreak = calculateStreak(workoutSessions.map((session) => session.completedAt ?? session.startedAt))
  const longestStreak = calculateLongestStreak(workoutSessions.map((session) => session.completedAt ?? session.startedAt))
  const averageFormScore = average(workoutSessions.map((session) => session.averageFormScore))
  const lifetimeXp = previousXp
  const completedGoals = goals.filter((goal) => goal.completed).length
  const currentLevel = determineLevel(lifetimeXp, currentStreak, averageFormScore, completedGoals)
  const levelIndex = levelUnlocks.findIndex((level) => level.title === currentLevel)
  const nextLevel = levelUnlocks[levelIndex + 1]

  return {
    currentLevel,
    xp: lifetimeXp,
    xpToNextLevel: nextLevel ? Math.max(nextLevel.minXp - lifetimeXp, 0) : 0,
    lifetimeXp,
    longestStreak,
    currentStreak,
    averageFormScore: Number(averageFormScore.toFixed(1)),
    completedGoals,
    milestoneHistory: levelUnlocks
      .filter((level) => level.minXp <= lifetimeXp)
      .map((level) => `${level.title} unlocked at ${level.minXp} XP`),
    updatedAt: new Date().toISOString(),
  }
}

export function getUnlockedFeatures(level: ExperienceLevel) {
  return levelUnlocks.find((item) => item.title === level)?.features ?? []
}

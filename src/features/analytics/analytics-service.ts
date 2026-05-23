import { format, subDays } from 'date-fns'

import type { AppSnapshot, SmartRecommendation } from '@/types/models'
import { average } from '@/lib/utils'
import { getDailyMealTotals, getDailyWaterTotal } from '@/features/nutrition/nutrition-utils'

export function buildTrendSeries(snapshot: AppSnapshot, days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const date = format(subDays(new Date(), days - index - 1), 'yyyy-MM-dd')
    const sessions = snapshot.workoutSessions.filter((session) => session.startedAt.startsWith(date))
    const meals = getDailyMealTotals(snapshot.mealEntries, date)
    const hydration = getDailyWaterTotal(snapshot.waterEntries, date)
    const sleep = snapshot.sleepEntries.find((entry) => entry.date === date)?.durationHours ?? 0
    return {
      date: format(new Date(date), 'MMM d'),
      workouts: sessions.length,
      xp: sessions.reduce((sum, session) => sum + session.xpGained, 0),
      caloriesBurned: sessions.reduce((sum, session) => sum + session.caloriesBurned, 0),
      formAccuracy: sessions.length ? Number(average(sessions.map((session) => session.averageFormScore)).toFixed(1)) : 0,
      reps: sessions.reduce((sum, session) => sum + session.repsCompleted, 0),
      mealCalories: meals.calories,
      hydration,
      sleep,
    }
  })
}

export function buildMuscleDistribution(snapshot: AppSnapshot) {
  const distribution = new Map<string, number>()
  for (const session of snapshot.workoutSessions) {
    const exercise = snapshot.exercises.find((item) => item.id === session.exerciseId)
    for (const muscle of exercise?.targetMuscles ?? []) {
      distribution.set(muscle, (distribution.get(muscle) ?? 0) + session.durationSeconds / 60)
    }
  }
  return [...distribution.entries()].map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }))
}

export function buildRecommendations(snapshot: AppSnapshot): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = []
  const trend = buildTrendSeries(snapshot, 7)
  const averageSleep = average(trend.map((entry) => entry.sleep))
  const averageHydration = average(trend.map((entry) => entry.hydration))
  const averageForm = average(trend.map((entry) => entry.formAccuracy).filter(Boolean))

  if (averageSleep < 7) {
    recommendations.push({
      id: 'sleep-debt',
      title: 'Protect recovery tonight',
      reason: 'Your seven-day sleep average is below seven hours.',
      action: 'Move your workout reminder earlier and aim for a consistent wind-down.',
      priority: 'warning',
    })
  }
  if (averageHydration < snapshot.profile.waterGoalMl * 0.7) {
    recommendations.push({
      id: 'hydration-gap',
      title: 'Hydration is trailing',
      reason: 'Water intake is below your daily goal on average.',
      action: 'Use the one-tap hydration quick add on the dashboard.',
      priority: 'warning',
    })
  }
  if (averageForm < 75) {
    recommendations.push({
      id: 'form-refresh',
      title: 'Schedule a technique session',
      reason: 'Form accuracy is slipping below your target band.',
      action: 'Run a ten-minute posture session and reduce tempo to rebuild control.',
      priority: 'critical',
    })
  }
  if (snapshot.workoutSessions.length >= 6 && snapshot.levelProgress.currentStreak >= 5) {
    recommendations.push({
      id: 'unlock-pressure',
      title: 'You are close to the next level',
      reason: `Only ${snapshot.levelProgress.xpToNextLevel} XP remain to unlock ${snapshot.levelProgress.currentLevel === 'Athlete' ? 'mastery perks' : 'the next rank'}.`,
      action: 'Complete a coached live workout or finish a quest for a faster climb.',
      priority: 'info',
    })
  }

  return recommendations
}

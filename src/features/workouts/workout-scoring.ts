import { calculateWorkoutXp } from '@/features/gamification/leveling'
import type { Exercise, FormEvent, RepEvent, WorkoutSession } from '@/types/models'
import { average } from '@/lib/utils'

export function estimateCalories(exercise: Exercise | undefined, durationSeconds: number, repsCompleted: number) {
  if (!exercise) return Math.round(durationSeconds / 60) * 5
  const repFactor = repsCompleted > 0 ? repsCompleted / 10 : 1
  return Math.max(5, Math.round((durationSeconds / 60) * exercise.caloriesPerMinute * Math.min(repFactor, 2)))
}

export function summarizeRecommendations(formEvents: FormEvent[]) {
  const issueCounts = new Map<string, number>()
  for (const event of formEvents) {
    issueCounts.set(event.message, (issueCounts.get(event.message) ?? 0) + 1)
  }
  return [...issueCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([message]) => message)
}

export function completeSessionDraft(
  session: WorkoutSession,
  exercise: Exercise | undefined,
  repEvents: RepEvent[],
  formEvents: FormEvent[],
  durationSeconds: number,
) {
  const averageFormScore = Number(average(repEvents.map((rep) => rep.score)).toFixed(1)) || 70
  const caloriesBurned = estimateCalories(exercise, durationSeconds, repEvents.length)
  const xpGained = calculateWorkoutXp({
    durationSeconds,
    averageFormScore,
    repsCompleted: repEvents.length,
    caloriesBurned,
  })

  return {
    ...session,
    completedAt: new Date().toISOString(),
    durationSeconds,
    repsCompleted: repEvents.length,
    caloriesBurned,
    averageFormScore,
    accuracyTrend: repEvents.map((rep) => rep.score),
    repEvents,
    formEvents,
    recommendations: summarizeRecommendations(formEvents),
    xpGained,
    updatedAt: new Date().toISOString(),
  }
}

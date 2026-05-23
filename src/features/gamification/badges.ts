import { isBefore, startOfWeek, subDays } from 'date-fns'

import type {
  AchievementHistory,
  AppSnapshot,
  Badge,
  MealEntry,
  WaterEntry,
  WorkoutSession,
} from '@/types/models'
import { average } from '@/lib/utils'

const badgeSeed: Array<Omit<Badge, 'unlocked' | 'unlockedAt' | 'updatedAt'>> = [
  { id: 'first-workout', name: 'First Workout', description: 'Completed your first tracked session.', icon: 'Sparkles', criteria: 'Finish 1 workout session.' },
  { id: '7-day-streak', name: '7-Day Streak', description: 'Stayed active for seven consecutive days.', icon: 'Flame', criteria: 'Current streak reaches 7 days.' },
  { id: '30-day-streak', name: '30-Day Streak', description: 'Sustained your practice for a full month.', icon: 'CalendarRange', criteria: 'Current streak reaches 30 days.' },
  { id: 'perfect-form-rep', name: 'Perfect Form Rep', description: 'Recorded a near-perfect repetition.', icon: 'Target', criteria: 'Any rep receives a score of 98 or higher.' },
  { id: 'consistency-king-queen', name: 'Consistency King/Queen', description: 'Turned discipline into momentum.', icon: 'Crown', criteria: 'Complete 12 workouts and hold a 10-day streak.' },
  { id: 'hydration-hero', name: 'Hydration Hero', description: 'Hit your hydration goal three days in a row.', icon: 'Droplets', criteria: 'Meet water target for 3 consecutive days.' },
  { id: 'meal-logger', name: 'Meal Logger', description: 'Built a reliable nutrition trail.', icon: 'UtensilsCrossed', criteria: 'Log 20 meals.' },
  { id: 'early-bird-trainer', name: 'Early Bird Trainer', description: 'Owned the early morning grind.', icon: 'Sunrise', criteria: 'Complete 5 workouts before 7:00 AM.' },
  { id: 'no-skip-week', name: 'No-Skip Week', description: 'Put together a high-adherence week.', icon: 'ShieldCheck', criteria: 'Complete 5 workouts in the current week.' },
  { id: 'squat-master', name: 'Squat Master', description: 'Reached a major squat volume milestone.', icon: 'ChevronDownSquare', criteria: 'Complete 100 tracked squat reps.' },
  { id: 'push-up-pro', name: 'Push-Up Pro', description: 'Built pressing power with strict reps.', icon: 'Armchair', criteria: 'Complete 80 tracked push-up reps.' },
  { id: 'form-fixer', name: 'Form Fixer', description: 'Improved movement quality over time.', icon: 'WandSparkles', criteria: 'Raise average form score by at least 10 points.' },
  { id: 'weekly-champion', name: 'Weekly Champion', description: 'Closed out a weekly challenge.', icon: 'Medal', criteria: 'Complete any weekly quest.' },
  { id: 'goal-crusher', name: 'Goal Crusher', description: 'Completed multiple profile goals.', icon: 'Trophy', criteria: 'Complete 3 goals.' },
]

function calculateWaterStreak(waterEntries: WaterEntry[], goal: number) {
  const today = new Date()
  let streak = 0
  for (let index = 0; index < 14; index += 1) {
    const day = subDays(today, index).toISOString().slice(0, 10)
    const total = waterEntries.filter((entry) => entry.date === day).reduce((sum, entry) => sum + entry.amountMl, 0)
    if (total >= goal) {
      streak += 1
    } else {
      break
    }
  }
  return streak
}

function morningWorkouts(workoutSessions: WorkoutSession[]) {
  return workoutSessions.filter((session) => {
    const hour = new Date(session.startedAt).getHours()
    return hour < 7
  }).length
}

function workoutsThisWeek(workoutSessions: WorkoutSession[]) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  return workoutSessions.filter((session) => !isBefore(new Date(session.startedAt), weekStart)).length
}

function repVolume(workoutSessions: WorkoutSession[], exerciseId: string) {
  return workoutSessions
    .filter((session) => session.exerciseId === exerciseId)
    .reduce((sum, session) => sum + session.repsCompleted, 0)
}

function formImproved(workoutSessions: WorkoutSession[]) {
  if (workoutSessions.length < 6) return false
  const sorted = [...workoutSessions].sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime())
  const first = average(sorted.slice(0, 3).map((session) => session.averageFormScore))
  const last = average(sorted.slice(-3).map((session) => session.averageFormScore))
  return last - first >= 10
}

export function buildBadgeCatalog(existing?: Badge[]) {
  const existingMap = new Map(existing?.map((badge) => [badge.id, badge]))
  return badgeSeed.map((seed) => {
    const current = existingMap.get(seed.id)
    return {
      ...seed,
      unlocked: current?.unlocked ?? false,
      unlockedAt: current?.unlockedAt,
      updatedAt: current?.updatedAt ?? new Date().toISOString(),
    }
  })
}

export function evaluateBadges(snapshot: AppSnapshot) {
  const badgeCatalog = buildBadgeCatalog(snapshot.badges)
  const unlockedHistory: AchievementHistory[] = []
  const sessionDates = snapshot.workoutSessions.map((session) => session.completedAt ?? session.startedAt)
  const streak = snapshot.levelProgress.currentStreak

  const conditions: Record<string, boolean> = {
    'first-workout': snapshot.workoutSessions.length >= 1,
    '7-day-streak': streak >= 7,
    '30-day-streak': streak >= 30,
    'perfect-form-rep': snapshot.workoutSessions.some((session) => session.repEvents.some((rep) => rep.score >= 98)),
    'consistency-king-queen': snapshot.workoutSessions.length >= 12 && streak >= 10,
    'hydration-hero': calculateWaterStreak(snapshot.waterEntries, snapshot.profile.waterGoalMl) >= 3,
    'meal-logger': snapshot.mealEntries.length >= 20,
    'early-bird-trainer': morningWorkouts(snapshot.workoutSessions) >= 5,
    'no-skip-week': workoutsThisWeek(snapshot.workoutSessions) >= 5,
    'squat-master': repVolume(snapshot.workoutSessions, 'squat') >= 100,
    'push-up-pro': repVolume(snapshot.workoutSessions, 'push-up') >= 80,
    'form-fixer': formImproved(snapshot.workoutSessions),
    'weekly-champion': snapshot.quests.some((quest) => quest.cadence === 'weekly' && quest.completed),
    'goal-crusher': snapshot.goals.filter((goal) => goal.completed).length >= 3,
  }

  const badges = badgeCatalog.map((badge) => {
    if (badge.unlocked || !conditions[badge.id]) return badge
    const unlockedAt = new Date().toISOString()
    unlockedHistory.push({
      id: `${badge.id}-${unlockedAt}`,
      badgeId: badge.id,
      earnedAt: unlockedAt,
      source: `Rules engine after ${sessionDates.length} sessions and ${snapshot.mealEntries.length} meals.`,
    })
    return {
      ...badge,
      unlocked: true,
      unlockedAt,
      updatedAt: unlockedAt,
    }
  })

  return { badges, unlockedHistory }
}

export function summarizeMeals(entries: MealEntry[]) {
  return entries.reduce(
    (summary, entry) => {
      summary.calories += entry.calories
      summary.protein += entry.protein
      summary.carbs += entry.carbs
      summary.fats += entry.fats
      return summary
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  )
}

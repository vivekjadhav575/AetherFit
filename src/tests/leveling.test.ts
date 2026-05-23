import { describe, expect, it } from 'vitest'

import { buildLevelProgress, calculateLongestStreak, calculateStreak, determineLevel } from '@/features/gamification/leveling'
import { createDefaultGoals } from '@/store/default-state'
import type { WorkoutSession } from '@/types/models'

const sessions: WorkoutSession[] = [
  {
    id: 'one',
    exerciseId: 'squat',
    startedAt: '2026-05-20T06:00:00.000Z',
    completedAt: '2026-05-20T06:20:00.000Z',
    durationSeconds: 1200,
    repsCompleted: 30,
    caloriesBurned: 180,
    averageFormScore: 82,
    accuracyTrend: [80, 82, 84],
    repEvents: [],
    formEvents: [],
    recommendations: [],
    xpGained: 200,
    updatedAt: '2026-05-20T06:20:00.000Z',
  },
  {
    id: 'two',
    exerciseId: 'push-up',
    startedAt: '2026-05-21T06:00:00.000Z',
    completedAt: '2026-05-21T06:20:00.000Z',
    durationSeconds: 1200,
    repsCompleted: 32,
    caloriesBurned: 190,
    averageFormScore: 84,
    accuracyTrend: [82, 84, 86],
    repEvents: [],
    formEvents: [],
    recommendations: [],
    xpGained: 220,
    updatedAt: '2026-05-21T06:20:00.000Z',
  },
]

describe('leveling', () => {
  it('calculates streak length', () => {
    expect(calculateStreak(['2026-05-21T06:20:00.000Z', '2026-05-22T06:20:00.000Z', '2026-05-23T06:20:00.000Z'])).toBeGreaterThanOrEqual(1)
  })

  it('calculates longest streak', () => {
    expect(calculateLongestStreak(['2026-05-01', '2026-05-02', '2026-05-04', '2026-05-05', '2026-05-06'])).toBe(3)
  })

  it('determines level from multiple signals', () => {
    expect(determineLevel(900, 6, 75, 1)).toBe('Intermediate')
  })

  it('builds level progress summary', () => {
    const goals = createDefaultGoals().map((goal, index) => ({ ...goal, completed: index === 0 }))
    const progress = buildLevelProgress(sessions, 950, goals)
    expect(progress.currentLevel).toBe('Beginner')
    expect(progress.averageFormScore).toBe(83)
  })
})

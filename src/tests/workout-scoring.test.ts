import { describe, expect, it } from 'vitest'

import { exerciseCatalog } from '@/features/workouts/exercises'
import { completeSessionDraft } from '@/features/workouts/workout-scoring'
import type { WorkoutSession } from '@/types/models'

describe('workout scoring', () => {
  it('computes calories, XP, and recommendations', () => {
    const base: WorkoutSession = {
      id: 'session',
      exerciseId: 'squat',
      startedAt: '2026-05-23T10:00:00.000Z',
      durationSeconds: 600,
      repsCompleted: 0,
      caloriesBurned: 0,
      averageFormScore: 0,
      accuracyTrend: [],
      repEvents: [],
      formEvents: [],
      recommendations: [],
      xpGained: 0,
      updatedAt: '2026-05-23T10:00:00.000Z',
    }

    const completed = completeSessionDraft(
      base,
      exerciseCatalog.find((exercise) => exercise.id === 'squat'),
      [{ id: 'rep-1', repNumber: 1, exerciseId: 'squat', timestamp: '2026-05-23T10:05:00.000Z', phase: 'up', score: 92 }],
      [{ id: 'form-1', timestamp: '2026-05-23T10:04:00.000Z', exerciseId: 'squat', code: 'depth', message: 'Lower a bit more for full depth.', severity: 'warning', scoreImpact: 12 }],
      600,
    )

    expect(completed.xpGained).toBeGreaterThan(0)
    expect(completed.caloriesBurned).toBeGreaterThan(0)
    expect(completed.recommendations[0]).toContain('Lower')
  })
})

import { describe, expect, it } from 'vitest'

import { evaluateBadges } from '@/features/gamification/badges'
import { createDefaultSnapshot } from '@/store/default-state'

describe('badges', () => {
  it('unlocks first workout and meal logger rules', () => {
    const snapshot = createDefaultSnapshot()
    snapshot.workoutSessions = [
      {
        id: 'session',
        exerciseId: 'squat',
        startedAt: '2026-05-23T06:00:00.000Z',
        completedAt: '2026-05-23T06:10:00.000Z',
        durationSeconds: 600,
        repsCompleted: 15,
        caloriesBurned: 90,
        averageFormScore: 91,
        accuracyTrend: [91],
        repEvents: [{ id: 'rep', exerciseId: 'squat', repNumber: 1, timestamp: '2026-05-23T06:02:00.000Z', phase: 'up', score: 99 }],
        formEvents: [],
        recommendations: [],
        xpGained: 120,
        updatedAt: '2026-05-23T06:10:00.000Z',
      },
    ]
    snapshot.mealEntries = Array.from({ length: 20 }, (_, index) => ({
      id: `meal-${index}`,
      date: '2026-05-23',
      mealType: 'lunch',
      title: `Meal ${index}`,
      calories: 300,
      protein: 20,
      carbs: 30,
      fats: 10,
      updatedAt: '2026-05-23T08:00:00.000Z',
    }))

    const result = evaluateBadges(snapshot)
    const unlockedIds = result.badges.filter((badge) => badge.unlocked).map((badge) => badge.id)
    expect(unlockedIds).toContain('first-workout')
    expect(unlockedIds).toContain('perfect-form-rep')
    expect(unlockedIds).toContain('meal-logger')
  })
})

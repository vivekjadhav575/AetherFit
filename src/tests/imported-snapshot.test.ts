import { describe, expect, it } from 'vitest'

import { sanitizeImportedSnapshot } from '@/lib/imported-snapshot'

describe('backup import sanitization', () => {
  it('accepts wrapped backup payloads and restores safe defaults', () => {
    const snapshot = sanitizeImportedSnapshot({
      app: 'AetherFit',
      snapshot: {
        user: { id: 'firebase-user-1', authMode: 'google', displayName: 'Restore User' },
        profile: { name: 'Restore User', heightCm: 182, weightKg: 81 },
        workoutSessions: [
          {
            id: 'session-1',
            exerciseId: 'squat',
            startedAt: '2026-05-23T06:00:00.000Z',
            durationSeconds: 600,
            repsCompleted: 20,
            caloriesBurned: 120,
            averageFormScore: 88,
            accuracyTrend: [85, 88, 90],
            repEvents: [],
            formEvents: [],
            recommendations: [],
            xpGained: 150,
            updatedAt: '2026-05-23T06:10:00.000Z',
          },
        ],
        settings: {
          reminders: {
            mealReminderTimes: ['07:30', '13:15', '19:45'],
          },
        },
      },
    })

    expect(snapshot.user.id).toBe('firebase-user-1')
    expect(snapshot.profile.userId).toBe('firebase-user-1')
    expect(snapshot.workoutSessions).toHaveLength(1)
    expect(snapshot.settings.reminders.mealReminderTimes).toEqual(['07:30', '13:15', '19:45'])
    expect(snapshot.exercises.length).toBeGreaterThan(0)
    expect(snapshot.workoutPlans.length).toBeGreaterThan(0)
  })

  it('throws for non-object backups', () => {
    expect(() => sanitizeImportedSnapshot('bad backup')).toThrow(/json object/i)
  })
})

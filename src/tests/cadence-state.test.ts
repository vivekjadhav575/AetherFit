import { describe, expect, it } from 'vitest'

import { createDefaultSnapshot, refreshCadenceState } from '@/store/default-state'

describe('cadence state refresh', () => {
  it('refreshes quests and habits for the active day', () => {
    const original = createDefaultSnapshot(new Date('2026-05-20T08:00:00.000Z'))
    const refreshed = refreshCadenceState(original, new Date('2026-05-23T08:00:00.000Z'))

    expect(refreshed.lastActiveDate).toBe('2026-05-23')
    expect(refreshed.quests).toHaveLength(3)
    expect(refreshed.quests[0]?.id).toBe('daily-workout-2026-05-23')
    expect(refreshed.habitEntries.every((habit) => habit.date === '2026-05-23')).toBe(true)
  })
})

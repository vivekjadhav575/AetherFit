import { describe, expect, it } from 'vitest'

import { mergeSnapshots } from '@/services/sync-service'
import { createDefaultSnapshot } from '@/store/default-state'

describe('sync merge logic', () => {
  it('keeps the newest entities and unions favorites', () => {
    const local = createDefaultSnapshot()
    const remote = createDefaultSnapshot()
    local.favorites = ['squat']
    remote.favorites = ['push-up']
    local.profile.name = 'Local User'
    local.profile.updatedAt = '2026-05-23T10:00:00.000Z'
    remote.profile.name = 'Remote User'
    remote.profile.updatedAt = '2026-05-23T09:00:00.000Z'

    const merged = mergeSnapshots(local, remote)
    expect(merged.profile.name).toBe('Local User')
    expect(merged.favorites).toEqual(expect.arrayContaining(['squat', 'push-up']))
  })
})

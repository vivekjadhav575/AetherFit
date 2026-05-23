import Dexie, { type Table } from 'dexie'

import type { AppSnapshot } from '@/types/models'

interface SnapshotRecord {
  id: 'current'
  snapshot: AppSnapshot
}

class AetherFitDatabase extends Dexie {
  snapshots!: Table<SnapshotRecord, 'current'>

  constructor() {
    super('aetherfit-db')
    this.version(1).stores({
      snapshots: 'id',
    })
  }
}

export const db = new AetherFitDatabase()

export async function loadSnapshot() {
  return db.snapshots.get('current')
}

export async function saveSnapshot(snapshot: AppSnapshot) {
  await db.snapshots.put({ id: 'current', snapshot })
}

export async function clearSnapshot() {
  await db.snapshots.clear()
}

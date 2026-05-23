import { sanitizeImportedSnapshot } from '@/lib/imported-snapshot'
import type { AppSnapshot } from '@/types/models'

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function escapeCsvCell(value: string | number) {
  const text = String(value)
  if (!/[",\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

export function exportSnapshotJson(snapshot: AppSnapshot) {
  const payload = {
    app: 'AetherFit',
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    schemaVersion: snapshot.schemaVersion,
    snapshot,
  }
  downloadBlob(
    `aetherfit-backup-${new Date().toISOString().slice(0, 10)}.json`,
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
  )
}

export function exportWorkoutCsv(snapshot: AppSnapshot) {
  const rows = [
    ['date', 'exercise', 'duration_seconds', 'reps', 'form_score', 'xp', 'calories'],
    ...snapshot.workoutSessions.map((session) => [
      session.completedAt ?? session.startedAt,
      session.exerciseId,
      String(session.durationSeconds),
      String(session.repsCompleted),
      String(session.averageFormScore),
      String(session.xpGained),
      String(session.caloriesBurned),
    ]),
  ]
  downloadBlob(
    `aetherfit-workouts-${new Date().toISOString().slice(0, 10)}.csv`,
    new Blob([rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\n')], { type: 'text/csv' }),
  )
}

export async function importSnapshotFile(file: File) {
  const text = await file.text()
  return sanitizeImportedSnapshot(JSON.parse(text))
}

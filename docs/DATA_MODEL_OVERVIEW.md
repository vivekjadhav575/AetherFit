# Data Model Overview

Key models are defined in `src/types/models.ts`.

## Core entities

- `User`: account identity, auth mode, role, timestamps
- `Profile`: body metrics, goals, workout style, privacy defaults
- `Goal`: measurable profile goals and completion state
- `Exercise`: library entry with muscles, difficulty, tips, mistakes, and real-time support flag
- `WorkoutPlan`: reusable plan bundles with unlock level and item prescriptions
- `WorkoutSession`: persisted session summary, reps, form events, XP, and recommendations
- `RepEvent`: per-rep scoring output from the live coach
- `FormEvent`: technique corrections with severity and score impact
- `Badge`: gamification milestone definition and unlock state
- `LevelProgress`: XP, streak, level, and progress-to-next-tier values
- `MealEntry`, `WaterEntry`, `SleepEntry`, `WeightEntry`, `MoodEntry`: wellness logging entities
- `NotificationPreference`: reminder timing and browser notification options
- `SyncStatus`: local/cloud state, last sync time, pending changes
- `AuditLog`: store mutation trail for key product actions
- `AchievementHistory`: historical record of badge unlocks
- `CalibrationProfile`: neutral stance and framing references for pose coaching

## Snapshot design

All persistent product state is packed into a single `AppSnapshot`.

Benefits:

- Easy IndexedDB save/load path
- Easy JSON backup/export
- Straightforward conflict resolution for manual cloud sync
- Simple future migrations via `schemaVersion`

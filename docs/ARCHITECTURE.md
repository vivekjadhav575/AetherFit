# Architecture Overview

## High-Level Layers

- `src/app`: top-level providers, router composition, shell bootstrapping
- `src/routes`: route protection and page wiring
- `src/components`: reusable UI primitives, layout shell, shared cards and motion blocks
- `src/features`: domain modules for auth, dashboard, workouts, pose, nutrition, analytics, profile, settings, sync, reminders, and gamification
- `src/store`: Zustand app store plus default state builders
- `src/lib`: utilities, Dexie persistence, Firebase wiring
- `src/services`: sync helpers, exports, speech coaching, notification scheduling, and pose model loading
- `src/hooks`: webcam and live-pose session logic
- `src/tests`: unit, UI, and e2e coverage

## State Strategy

- Global product state lives in Zustand as a single `AppSnapshot` object.
- The snapshot is persisted to IndexedDB through Dexie after every meaningful mutation.
- Derived systems such as goals, quests, level progression, and badges are recalculated during store updates.
- Cloud sync merges local and remote snapshots using timestamp-based entity reconciliation.

## Real-Time Flow

1. User enables the camera in the live coach page.
2. MediaPipe Pose Landmarker loads in-browser.
3. Each frame is processed on a requestAnimationFrame loop.
4. Landmark geometry is evaluated with a rules engine.
5. Rep events, form events, form score, and movement phase update in real time.
6. Text feedback is shown immediately.
7. Speech synthesis speaks only on state changes or critical issues.
8. Session completion writes structured workout history back into the store.

## Offline and Sync

- Local persistence is the default source of truth.
- Guest users never need a backend.
- Signed-in users can manually trigger cloud merge + upload.
- Sync respects privacy toggles and keeps the app usable even without Firebase configuration.

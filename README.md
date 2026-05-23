# AetherFit

AetherFit is a production-oriented fitness and wellness tracker built with React, TypeScript, Vite, Tailwind CSS, Zustand, Dexie, Recharts, MediaPipe Pose Landmarker, React Hook Form, and Firebase-ready Google sign-in.

## Highlights

- Local-first onboarding, profile management, and wellness storage with Dexie / IndexedDB
- Google-ready authentication and cloud sync wiring through Firebase Auth and Firestore
- Real-time posture coaching with webcam capture, MediaPipe pose estimation, overlay rendering, rep counting, joint-angle rules, and text/audio feedback
- Workout library with searchable exercise cards, animated demo previews, plans, favorites, and recent history
- Gamification with XP, level progression, streaks, quests, badges, unlock rules, and session reward summaries
- Nutrition and wellness tracking for meals, water, sleep, weight, and mood
- Analytics dashboard with charts for XP, calories, hydration, form accuracy, sleep, and muscle distribution
- Neumorphism-inspired responsive UI with light/dark mode and PWA support
- JSON/CSV export, backup import, privacy controls, and reset flows
- Unit tests plus verified Playwright end-to-end coverage

## Stack

- React 19 + TypeScript
- Vite + vite-plugin-pwa
- Tailwind CSS + shadcn-style component primitives
- Zustand for app state
- Dexie for offline-first persistence
- React Hook Form + Zod for typed forms
- Framer Motion for UI motion and exercise preview loops
- Recharts for analytics
- MediaPipe Pose Landmarker for live coaching
- Firebase compat SDK for Google auth and Firestore sync

## Getting Started

1. Install dependencies:

```bash
npm install
```

PowerShell note:

```powershell
npm.cmd install
```

2. Copy environment variables if you want Google sign-in and cloud sync:

```bash
copy .env.example .env
```

3. Fill Firebase web app settings in `.env`.

4. Start the app:

```bash
npm run dev
```

PowerShell alternative:

```powershell
npm.cmd run dev
```

5. Run checks:

```bash
npm run build
npm run lint
npm run test
```

6. Optional e2e run:

```bash
npx playwright install
npm run test:e2e
```

## Firebase Setup

Firebase is optional. Guest mode, offline storage, and all local features work without it.

When enabling Google sync:

- Create a Firebase web app
- Enable Google sign-in in Firebase Authentication
- Enable Firestore in production or test mode as appropriate
- Add the web config values to `.env`
- Deploy the included `firestore.rules`

## Architecture Guides

- [Architecture overview](./docs/ARCHITECTURE.md)
- [Data model overview](./docs/DATA_MODEL_OVERVIEW.md)
- [Pose engine explanation](./docs/POSE_ENGINE.md)
- [Level and badge rules](./docs/LEVEL_AND_BADGE_RULES.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [Privacy note](./docs/PRIVACY_NOTE.md)
- [Deployment note](./docs/DEPLOYMENT.md)
- [Ready-to-run checklist](./docs/READY_TO_RUN_AND_TODO.md)
- [Changelog](./docs/CHANGELOG.md)
- [Codex work log](./docs/CODEX_WORK_LOG.md)

## Important Notes

- This product provides fitness guidance, not medical advice.
- Raw video is not stored by default. The app favors landmark-derived feedback and local processing.
- Browser notifications only fire while the app is open unless you extend the reminder system with additional platform-specific background support.
- The MediaPipe model is loaded from Google-hosted assets at runtime. Internet access is needed the first time the model is requested.

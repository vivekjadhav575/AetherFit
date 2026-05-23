# CODEX_WORK_LOG

## 2026-05-23 15:25 IST

- Completed work:
  - Scaffolded Vite + React + TypeScript app and installed core dependencies.
  - Built app shell, global theme system, neumorphism-inspired UI primitives, routing, onboarding, dashboard, workout library, live coach, nutrition, analytics, profile, and settings pages.
  - Implemented Dexie-based local-first persistence, Zustand snapshot state, quest/goal recalculation, XP progression, badges, export/import, and Firebase-ready auth/sync wiring.
  - Implemented MediaPipe-based live pose flow with overlay rendering, rep detection, form scoring, text feedback, and speech synthesis coaching.
  - Added unit tests, Playwright e2e scaffolding, environment example, and documentation pack.
- Files changed:
  - `package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.app.json`, `eslint.config.js`
  - `src/app/*`, `src/components/**/*`, `src/features/**/*`, `src/hooks/use-live-pose.ts`, `src/lib/*`, `src/services/*`, `src/store/*`, `src/styles/globals.css`, `src/routes/router.tsx`, `src/tests/**/*`
  - `public/icons/icon.svg`, `.env.example`, `playwright.config.ts`, `README.md`, `docs/*`
- Architectural decisions:
  - Used a single `AppSnapshot` persisted via Dexie for simple local-first sync and backup/export.
  - Kept pose inference in-browser with requestAnimationFrame throttling for a practical low-latency baseline.
  - Wired Google auth and cloud sync through Firebase compat SDK to keep browser-side auth practical without frontend secrets.
- Bugs found:
  - Type friction between Zod coercion and React Hook Form generics.
  - Firebase modular import mismatch in installed package version.
  - Pose overlay connection type mismatch.
- Bugs fixed:
  - Switched form typing to explicit `z.input` / `z.output` pairs.
  - Moved Firebase storage/auth access to compat API.
  - Updated pose overlay and sync merge utilities to match runtime data shape.
- Known issues:
  - Production bundle is large because pose, charts, and Firebase are in the main build; route-level code splitting is the next optimization target.
  - Browser notifications currently fire while the app is open; background reminder support is not implemented.
  - Playwright checks are scaffolded but may require browser installation before first run.
- Next planned tasks:
  - Add lazy route splitting and bundle optimization.
  - Expand trainer workflows and richer challenge scheduling.
  - Improve cloud sync conflict UI and automatic retry behavior.
- Commands to run:
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
  - `npm run test`
  - `npx playwright install`
  - `npm run test:e2e`
- Notes for next Codex agent:
  - Build and lint pass.
  - Unit tests still need a full run after any future logic edits.
  - If Firebase sync is being debugged, start from `src/lib/firebase.ts` and `src/features/settings/settings-page.tsx`.

## 2026-05-23 15:06 IST

- Completed work:
  - Added Vitest setup, unit coverage, Playwright scaffolding, and final verification pass.
  - Confirmed `npm run build`, `npm run lint`, and `npm run test` pass.
- Files changed:
  - `vite.config.ts`
  - `src/tests/*`
  - `docs/CODEX_WORK_LOG.md`
- Architectural decisions:
  - Limited Vitest discovery to `src/tests` so dependency tests from `node_modules` cannot leak into the suite.
- Bugs found:
  - Vitest was picking up third-party package tests.
  - Build failed on a leftover test polyfill annotation.
- Bugs fixed:
  - Added an explicit Vitest include pattern.
  - Replaced the `@ts-expect-error` polyfill with a safe `Object.defineProperty` shim.
- Known issues:
  - Main bundle is still large because charts, Firebase, and MediaPipe are bundled together.
- Next planned tasks:
  - Route-level lazy loading for bundle reduction.
- Commands to run:
  - `npm run build`
  - `npm run lint`
  - `npm run test`
- Notes for next Codex agent:
  - Current verification status is green for build, lint, and unit tests.

## 2026-05-23 16:08 IST

- Completed work:
  - Added route-level lazy loading plus vendor chunk splitting so the app no longer ships as one large main bundle.
  - Fixed a persisted-state routing bug so direct reloads to protected routes no longer bounce back incorrectly before Dexie finishes loading.
  - Added daily cadence refresh logic for quests and habits so the app stays correct across day changes.
  - Hardened backup import with snapshot sanitization and upgraded JSON export to include backup metadata.
  - Expanded settings with reminder controls, browser notification toggles, privacy-aware sync behavior, and safer backup import handling.
  - Upgraded trainer mode from a one-click stub to editable assignment inputs plus assignment removal.
  - Added Firebase deployment files: `firebase.json` and `firestore.rules`.
  - Added a run/setup checklist in `docs/READY_TO_RUN_AND_TODO.md`.
- Verification:
  - `npm.cmd run build`
  - `npm.cmd run lint`
  - `npm.cmd run test`
  - `npm.cmd run test:e2e`
- Remaining external setup only:
  - Fill `.env` with real Firebase values if Google sign-in and cloud sync are desired.
  - Deploy to HTTPS hosting for camera, auth popups, and production PWA usage.

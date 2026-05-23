# Ready To Run And TODO

## Current status

- Local-first guest mode is ready.
- Google sign-in and Firestore sync wiring are ready once Firebase env values are added.
- Live coach, workout library, nutrition logging, analytics, profile, settings, import/export, reminders, and trainer assignments are all wired.
- Direct route reloads now work correctly after persisted onboarding.
- Production build, lint, unit tests, and Playwright e2e all pass on this machine.

## What to install

1. Install Node.js 20+ if it is not already installed.
2. Install project packages:

```powershell
npm.cmd install
```

3. Install Playwright browsers for e2e:

```powershell
npx.cmd playwright install
```

4. Optional for cloud features: create a Firebase project and enable Google Auth + Firestore.

## How to run

### PowerShell

Use `npm.cmd` in PowerShell if `npm` is blocked by execution policy.

```powershell
npm.cmd run dev
```

### Build production bundle

```powershell
npm.cmd run build
```

### Run lint

```powershell
npm.cmd run lint
```

### Run unit tests

```powershell
npm.cmd run test
```

### Run e2e tests

```powershell
npm.cmd run test:e2e
```

## Firebase setup TODO

1. Copy env file:

```powershell
Copy-Item .env.example .env
```

2. Fill these values in `.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

3. Enable Google sign-in in Firebase Authentication.
4. Create Firestore database.
5. Deploy the included `firestore.rules`.

## Production deploy TODO

1. Build the app with `npm.cmd run build`.
2. Deploy the `dist/` folder to HTTPS hosting.
3. If using Firebase Hosting, this repo already includes `firebase.json` and `firestore.rules`.
4. Confirm camera access, auth popups, and notifications on the deployed origin.

## Nice-to-have future work

- Replace Firebase compat SDK with modular Firebase to reduce the last large vendor chunk.
- Add richer multi-user trainer workflows if this grows beyond single-user coaching.
- Add background reminder delivery beyond open-tab browser notifications.

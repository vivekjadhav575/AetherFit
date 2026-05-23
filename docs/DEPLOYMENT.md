# Deployment Note

## Static hosting

This app can be deployed to static hosts such as Vercel, Netlify, Firebase Hosting, or Cloudflare Pages.

## Required steps

1. Run `npm run build`
2. Deploy the `dist/` folder
3. Provide Firebase environment variables if Google sign-in and cloud sync are required
4. Confirm HTTPS is enabled because camera access and auth popups require secure origins
5. If using Firebase Hosting, deploy the included `firebase.json` and `firestore.rules`

## PWA

- Manifest and service worker are generated during build through `vite-plugin-pwa`
- The current cache strategy is appropriate for app shell assets and offline revisits

## Production hardening suggestions

- Replace Firebase compat imports with modular Firebase to reduce the remaining large Firebase bundle
- Expand sync conflict resolution UI if you expect heavy multi-device use
- Move reminders to a platform-backed notification channel if you need true background delivery

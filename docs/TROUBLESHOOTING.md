# Troubleshooting

## Camera will not start

- Check browser camera permission
- Make sure another app is not locking the webcam
- Reload after changing permission settings

## Live coach feels inaccurate

- Improve front lighting
- Keep the full body in frame
- Use a side angle for side-dominant exercises such as squats or push-ups
- Re-run calibration before the session

## Google sign-in or sync fails

- Confirm `.env` values match a Firebase web app
- Enable Google sign-in in Firebase Authentication
- Confirm Firestore is enabled
- Review browser popup blocking settings

## Notifications do not appear

- Grant browser notification permission
- Keep the app open in a foreground tab for current reminder logic

## Tests fail locally

- Run `npm install`
- For Playwright, run `npx playwright install`
- If IndexedDB tests are flaky in a custom environment, run them in the default jsdom setup included in this project

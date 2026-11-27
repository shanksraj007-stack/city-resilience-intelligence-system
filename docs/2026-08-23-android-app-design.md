# CRIS Android App — Design Spec

Date: 2026-08-23
Status: Approved (user: "do yourself")

## Goal
Package the existing CRIS React frontend as an installable, sideloaded
Android APK using Capacitor. Target Android 6.0+ (minSdk 23,
targetSdk 35), ~98% of active devices. No frontend rewrite.

## Decisions
- **Capacitor 7 wrapper** around `frontend/` (Vite build -> native shell).
- **Backend over plain HTTP on LAN** (`http://<LAN-IP>:8000`). The current
  self-signed HTTPS setup is rejected by Android WebView; installing CAs on
  demo phones is not practical. Cleartext is enabled in the app manifest for
  this demo configuration only.
- **API URL baked at build time** via `.env.mobile` ->
  `VITE_API_URL=http://<LAN-IP>:8000`. `api.ts` already consumes it.
- **Sideload APK**, signed with a local keystore.

## Code changes
1. `src/hooks/useWebSocket.ts` — derive WS URL from `VITE_API_URL`
   (fallback to `window.location`) instead of assuming same-origin.
2. `src/services/simulationReporter.ts`, `src/simulation/incidentReporter.ts`,
   `src/pages/mobile/MobileDetectPage.tsx` — use a shared `getApiBase()`
   helper so relative `/api`, `/uploads`, `/collision` paths resolve to the
   LAN backend inside the app shell.
3. New shared helper `src/utils/apiBase.ts`.
4. Backend: new script `scripts/backend-http.sh` starting uvicorn WITHOUT SSL
   on 0.0.0.0:8000 (stop the HTTPS instance first; port conflict). Vite dev
   proxy unchanged (desktop workflow untouched).
5. Native shell: `cleartextTrafficPermitted=true`, INTERNET + CAMERA +
   ACCESS_FINE_LOCATION permissions, CRIS app icon/splash.

## Build pipeline
- `npm run build:mobile` = `tsc -b && vite build --mode mobile`
- `npx cap sync android` copies dist into the shell
- Gradle assembleRelease with keystore from `android/keystore.properties`
  (gitignored) -> `frontend/android/app/build/outputs/apk/release/`

## Prerequisites installed by implementation
- Android cmdline-tools + platform 35 + build-tools at `~/Android/Sdk`
- JDK 21 (Temurin tarball under ~/.local if system Java 25 breaks Gradle)

## Error handling / testing
- Verify: `vite build --mode mobile` succeeds; `cap sync` OK;
  `./gradlew assembleRelease` produces APK; apk contains correct
  minSdk/targetSdk and cleartext config.
- Runtime smoke test requires a phone on the same Wi-Fi (user step):
  install APK, log in as admin@cris.gov against LAN backend.

## Out of scope
- Play Store publishing, hosted production deployment, offline mode,
  push notifications.

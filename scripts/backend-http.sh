#!/bin/bash
# Start the CRIS backend in PLAIN HTTP mode for the Android app.
#
# The Android WebView rejects self-signed HTTPS certs, so the mobile APK
# talks to the backend over plain HTTP on the LAN. Stop the HTTPS instance
# first (port 8000 conflict):
#   pkill -f "uvicorn app.main:app"
#
# Then run this script. The app expects the backend at:
#   http://<this-machine's-LAN-IP>:8000   (currently 10.237.32.158)
# If your LAN IP changes, update frontend/.env.mobile and rebuild:
#   cd frontend && npm run build:mobile && npx cap sync android
#   (then rebuild the APK — see docs/2026-08-23-android-app-design.md)

cd "$(dirname "$0")/../backend"
exec ./venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000

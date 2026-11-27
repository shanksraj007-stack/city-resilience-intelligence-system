# CRIS — Urban Cascade Risk Intelligence Platform

> A smart-city incident command center: live dashboard, incident map, citizen reports,
> AI video detection, live weather/flood risk, role-based access, and a 3D city
> digital-twin simulation of cascading disasters.

This repository is published **as delivered** from the original project archive. No
application source files have been changed. This README documents what is in the
repository and how to install and run it.

---

## ⚠️ Read this first — demo credentials

This project ships with **fixed demo accounts and placeholder signing keys**. They are
fine for a local demo, but they are not safe for an internet-facing deployment.

| Item | Value in source |
|---|---|
| Super admin | `admin@cris.gov` / `Admin@123456` |
| Six department accounts | `Dept@123456` |
| JWT / signing secrets | `change-me-in-production` |
| Compose Postgres password defaults | `cris_secret_2024` / `ucrase_secret_2024` |
| `frontend/public/dev-bootstrap.html` | Auto-logs in as the admin in a browser |

Change these before exposing the app publicly. See [Before production](#before-production).

---

## 1. What the project does

From `PROJECT_TECH_STACK.txt`:

- One real-time command center for city departments: accidents, fires, floods, water
  leaks, power cuts, road damage, and gas leaks.
- Users: city admins, department teams, and citizens reporting issues.
- Live dashboard, incident map, citizen reporting portal, live weather + flood risk,
  AI video detection (accident / fire / smoke), 3D city simulation, photo/video
  evidence, real-time alerts, and role-based login.

Flow: someone reports an incident (or the AI spots it from a camera / the 3D sim) →
the backend stores it, assigns priority and risk score, routes it to the right
department, and pushes a live WebSocket alert → dashboard and map update instantly.

### Key features

- **FastAPI backend** — async SQLAlchemy 2, JWT auth, bcrypt passwords, role-based
  access, CORS, upload validation, WebSockets.
- **React + TypeScript frontend** — Vite, HeroUI, Leaflet maps, Recharts, Zustand,
  TanStack Query, React Router.
- **AI detection** — YOLOv4-tiny (OpenCV DNN, CPU), Haar/HOG fallback, fire/smoke HSV
  detection, bbox-based accident detection, tracking with NumPy/filterpy, short MP4
  evidence clips. No GPU or external ffmpeg binary needed.
- **3D digital twin** — a standalone Three.js city simulation and a React Three Fiber
  version, with disaster triggers and incident posting.
- **Live weather** — Open-Meteo (no API key required), with a hardcoded fallback.

---

## 2. The simulation

There are two simulation entry points, both reachable from the admin UI: `/simul`
(iframe wrapper) and `/admin/simulation` (React Three Fiber page).

### 2.1 Standalone digital twin — `frontend/public/simul/`

`index.html`, `app.js` (~71 KB), `styles.css`. Title: *"CRIS - Smart City Urban
Cascading Disaster Digital Twin"*.

- Three.js city scene with 11 vehicle types (including police and ambulance),
  pedestrians, power grid, water main and road infrastructure gauges.
- Five CCTV feeds/cameras with auto-focus on incidents, day/night and underground
  views, and a kiosk/CCTV tile mode.
- Trigger controls for **accident**, **water leak**, **fire** and **cascading
  disaster**, plus overspeed, 5-stage road damage, lane toggles, pipe leak, blackout
  and emergency dispatch.
- Collisions trigger CCTV verification; incidents are posted to `/api/incidents/` and
  snapshots to `/api/stream/verify`; WebSocket messages sync camera focus in real time.
- Requires internet: Three.js `0.160.0` is loaded from jsDelivr and fonts from Google
  Fonts.

### 2.2 React simulation engine — `frontend/src/simulation/`

`engine.ts` (~70 KB), `roadNetwork.ts`, `pathfinding.ts`, `pedestrianEngine.ts`,
`runtime.ts`, `types.ts`, plus `simulationStore.ts`.

- Deterministic 30 Hz tick runtime with interpolation and buffered events.
- Kinematic vehicle engine with BFS pathfinding, no immediate U-turns and blocked-edge
  avoidance.
- Pedestrian state machine with crosswalks, vehicle sensing and crowd avoidance.
- `DemoController.tsx` autonomously triggers accident / water leak / fire.
- `simulationReporter.ts` deduplicates events and attaches canvas snapshots.
- Unit tests in `src/simulation/__tests__/` (engine, runtime, pedestrian engine/world);
  run with `npm run test:sim`. The E2E validator `scripts/validate_sim.py` runs the
  S1–S20 scenarios (Linux/Python 3 helper).

---

## 3. Repository layout

```text
city-resilience-intelligence-system-main/
├── backend/               FastAPI app, AI detectors, Alembic migrations, tests
│   ├── app/
│   │   ├── ai/            detector.py, accident_detector.py, fire_detector.py,
│   │   │                  tracker.py, pipeline.py, models/yolov4-tiny.*
│   │   ├── api/           auth, users, incidents, weather, dashboard, websocket
│   │   ├── core/          settings.py, security.py, database.py
│   │   └── main.py        app entrypoint + demo account seeding
│   ├── migrations/        alembic environment + initial schema
│   ├── requirements.txt   32 pinned Python packages
│   └── tests/             pytest suites
├── frontend/              React + Vite app
│   ├── public/simul/      standalone 3D digital twin
│   ├── src/simulation/    simulation engine and tests
│   └── src/pages/admin/   simulation admin pages
├── docker/                docker-compose.yml, .env.example, nginx config
├── docs/                  android app design notes
├── scripts/               validation helpers (Linux/bash)
├── Dockerfile             production all-in-one image
├── render.yaml            Render.com deployment blueprint
└── PROJECT_TECH_STACK.txt original project overview
```

---

## 4. Prerequisites — redistributables and runtimes

These are the runtimes/libraries you must install on a Windows machine. Commands are
**CMD** commands using `winget`. Run CMD as Administrator for the machine-wide installs.

### Required for the backend

| What | Version | Why |
|---|---|---|
| Python | **3.11.x** (3.12.x also works) | `from datetime import UTC` needs ≥3.11; Ruff target and root Dockerfile use 3.11 |
| Microsoft Visual C++ 2015–2022 Redistributable (x64) | latest | Native wheels: `numpy`, `opencv-python-headless`, `cryptography`, `bcrypt` |
| Git | any recent | clone / update this repo |

### Required for the frontend

| What | Version | Why |
|---|---|---|
| Node.js + npm | **22.13+ LTS or 24.x** | Vite build/dev server; Capacitor CLI requires Node ≥22, ESLint/Vitest prefer ≥22.13 |

### Optional

| What | When you need it |
|---|---|
| PostgreSQL 16 | If you want Postgres instead of the default SQLite (Docker/Render use Postgres) |
| Docker Desktop | To run the whole stack with `docker compose up --build` |
| Microsoft Visual C++ Build Tools ("Desktop development with C++") | Only if a native npm module fails to install; not normally needed |
| JDK 21 (Temurin) + Android Studio / Android SDK Platform 36 | Only for the Capacitor Android build (Gradle 8.14.3, AGP 8.13.0) |
| Redis | **Not needed** — `REDIS_URL` is declared but no Redis client code exists |
| CUDA / GPU | **Not needed** — YOLO runs on OpenCV CPU |
| ffmpeg binary | **Not needed** — OpenCV's bundled FFmpeg writes the evidence MP4s |
| .NET runtime | **Not needed** |

### Install commands (Windows CMD)

```bat
winget install --id Git.Git -e --source winget
winget install --id Python.Python.3.11 -e --source winget
winget install --id Microsoft.VCRedist.2015+.x64 -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

Optional:

```bat
winget install --id PostgreSQL.PostgreSQL.16 -e --source winget
winget install --id Docker.DockerDesktop -e --source winget
winget install --id Microsoft.OpenJDK.21 -e --source winget
```

Verify the installs:

```bat
python --version
node --version
npm --version
git --version
docker --version
```

> If `python` opens the Microsoft Store or does nothing, you have the Store alias
> stub. Install Python from the command above, then **close and reopen CMD**. The
> real interpreter must be ahead of `WindowsApps` in `PATH`, or call it by full path.

---

## 5. Quick start — local development (SQLite)

This is the shortest path. No PostgreSQL, Redis, or Docker required. Replace the
`C:\ucrip\...` path in the commands below with the folder where you extracted/cloned
this repository.

### Terminal 1 — backend

```bat
cd /d C:\ucrip\city-resilience-intelligence-system-main\backend
python -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
alembic upgrade head
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

> If SQLite tables already exist from a previous run, `alembic upgrade head` may say
> the tables already exist. Use `alembic stamp head` instead in that case.

### Terminal 2 — frontend

```bat
cd /d C:\ucrip\city-resilience-intelligence-system-main\frontend
npm ci --legacy-peer-deps
npm run dev
```

Open the URL Vite prints (`http://localhost:5173`, bound to `0.0.0.0`). The backend
runs on `http://127.0.0.1:8000`. Vite proxies `/api`, `/ws` (WebSocket) and `/uploads`
to port `8000`, so the frontend needs the backend running first for login, dashboards,
incidents, map and live alerts. Set `VITE_API_URL` only for a separate backend host;
otherwise the app uses same-origin `/api`. HTTPS dev is opt-in with `HTTPS_DEV=1` and
`frontend/certs/key.pem`.

### Standalone simulation only

If you just want the 3D digital twin without the React app:

```bat
cd /d C:\ucrip\city-resilience-intelligence-system-main\frontend\public\simul
python -m http.server 8080
```

Then open `http://localhost:8080/index.html`. It needs internet for the Three.js CDN
and Google Fonts. Incident buttons will post to the backend only if it is running.

### Health check

```bat
curl http://127.0.0.1:8000/health
```

---

## 6. Environment variables

Create `backend\.env` to override defaults (uppercase keys, case-sensitive), or use
`set KEY=value` in CMD before launching. Defaults:

| Key | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./cris.db` | Async URL used by the app |
| `DATABASE_URL_SYNC` | `sqlite:///./cris.db` | Used by Alembic — set both when switching to Postgres |
| `REDIS_URL` | `redis://localhost:6379/0` | Declared, unused |
| `SECRET_KEY` | `change-me-in-production` | Change it |
| `JWT_SECRET_KEY` | `change-me-in-production` | Change it — signs access tokens |
| `JWT_REFRESH_SECRET_KEY` | `change-me-in-production` | Change it — signs refresh tokens |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | |
| `CORS_ORIGINS` | localhost:5173/3000/8000, `"*"`, plus internal IPs | Use a JSON array string; remove `"*"` in production |
| `WEATHER_API_KEY` | `demo` | Unused — Open-Meteo is keyless |
| `WEATHER_CITY` / `CITY_NAME` | `Vijayamangalam` | |
| `CITY_LAT` / `CITY_LON` | `11.2448` / `77.5017` | |
| `UPLOAD_DIR` | `<project-root>\uploads` | Auto-created |
| `MODEL_DIR` | `<project-root>\backend\app\ai\models` | YOLOv4-tiny config + 23 MB weights |
| `DEBUG` | `False` | |
| `LOG_LEVEL` | `INFO` | |
| `MAX_UPLOAD_SIZE_MB` | `20` | |
| `ALLOWED_UPLOAD_TYPES` | `image/jpeg,image/png,image/webp` | |

Docker Compose also reads `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`
from `docker\.env` (see `docker\.env.example`). The committed Compose defaults have a
password mismatch — always supply your own `.env`.

### Demo accounts (seeded automatically at startup)

| Role | Email | Password |
|---|---|---|
| Super admin | `admin@cris.gov` | `Admin@123456` |
| Emergency, Traffic, Water, Electricity, Disaster, Surveillance | `<dept>@cris.gov` | `Dept@123456` |

---

## 7. Docker deployment (optional)

```bat
cd /d C:\ucrip\city-resilience-intelligence-system-main\docker
copy .env.example .env
```

Edit `docker\.env` and set strong values for `POSTGRES_PASSWORD`, `SECRET_KEY`,
`JWT_SECRET_KEY`, and `JWT_REFRESH_SECRET_KEY`. Make sure the Postgres password in
the `.env` matches the one embedded in the backend database URLs in
`docker-compose.yml`.

```bat
docker compose up --build
```

This starts PostgreSQL 16, the FastAPI backend, and an nginx-served frontend behind a
reverse proxy. `render.yaml` is the equivalent blueprint for Render.com.

Note: Compose relies on the app's automatic `create_all()` and does not run Alembic.

---

## 8. Tests

```bat
cd /d C:\ucrip\city-resilience-intelligence-system-main\backend
call .venv\Scripts\activate.bat
python -m pytest
```

```bat
cd /d C:\ucrip\city-resilience-intelligence-system-main\frontend
npm run typecheck
npm run test:sim
npm run lint
npm run build
```

Other frontend scripts: `npm run build:mobile`, `npm run preview`, `npm run format`,
`npm run format:check`.

---

## 9. Android build (optional)

Capacitor Android requires JDK 21 (Temurin), Android Studio with **SDK Platform 36**,
and `ANDROID_HOME`/`ANDROID_SDK_ROOT` set. The project uses Capacitor 8.5.0, Gradle
8.14.3, AGP 8.13.0, `minSdkVersion 24`, and app id `gov.vijayamangalam.cris`.
`frontend\.env.mobile` currently points at a private LAN address — change
`VITE_API_URL` to your reachable backend before building.

```bat
cd /d C:\ucrip\city-resilience-intelligence-system-main\frontend
npm run build:mobile
npx cap sync android
cd android
gradlew.bat assembleRelease
```

---

## 10. External network dependencies

The following need internet access:

- Three.js `0.160.0` from jsDelivr and Google Fonts (standalone simulation and app).
- Map tiles: Google Satellite/Hybrid/Terrain and OpenStreetMap streets (Leaflet).
- Open-Meteo weather API (keyless; falls back to hardcoded values when offline).
- npm/pypi installs and, for Android, the Gradle distribution and Maven repositories.

TensorFlow.js / COCO-SSD are installed as npm packages, not loaded from a CDN.

---

## 11. Before production

1. Replace all `change-me-in-production` values with long random secrets.
2. Replace the seeded admin/department passwords and disable auto-seeding outside a
   demo environment.
3. Remove or protect `frontend/public/dev-bootstrap.html` — it auto-authenticates as
   admin and is included in production builds.
4. Remove `"*"` from `CORS_ORIGINS` and set explicit origins.
5. Replace the internal LAN IPs in `frontend/.env.mobile`, `scripts/backend-http.sh`,
   and the CORS defaults.
6. Give `docker\.env`, `frontend\.env.mobile`, and other local env files proper
   `.gitignore` entries before committing any of your own configuration.
7. Consider Git LFS for `backend/app/ai/models/yolov4-tiny.weights` (23 MB); it is
   below GitHub's 100 MB limit but above the 5 MB warning threshold.

---

## 12. Notes on the delivered source

- The source tree is the original archive content, byte-for-byte verified against the
  ZIP (229 files, 0 mismatches). This README is the only added file.
- `scripts/*.sh` and `start-vite.sh` are Linux/bash helper scripts with Linux venv
  paths; use the Windows commands above instead.
- Weather calls use `api.open-meteo.com` and need internet; if unavailable, the app
  falls back to hardcoded values.
- The YOLOv4-tiny weights/config are included, so no separate model download is needed.

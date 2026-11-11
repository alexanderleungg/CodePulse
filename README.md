# CodePulse

**GitHub developer analytics and a goal-based skill practice tracker.**

CodePulse turns GitHub activity into a view of where you are practicing, when you last used a skill, and what you could build next. It includes a working FastAPI backend, persistent storage, a React dashboard, GitHub REST integration, an explainable recommendation engine, a project planner, and manual learning entries.

The project adapts the supplied LeetCode tracker while preserving its main folder structure and React/Vite + Python/FastAPI architecture. It intentionally keeps JavaScript/JSX instead of introducing a Next.js/TypeScript migration.

**New here? Follow [START_HERE.md](START_HERE.md).**

## Features

- **GitHub activity:** connect a public username without credentials, or use optional GitHub OAuth. Inspect repositories, authored commits, pull requests, languages, activity heatmaps, and weekly trends.
- **Practice distribution:** organize evidence into frontend, backend, databases, algorithms, and systems. Heuristics use repository languages and available dependency/path signals; they are estimates you can interpret alongside the source repositories.
- **Your goals:** choose a target skill mix and weekly active-day goal. A frontend specialist does not need to receive systems projects unless systems is part of their goal.
- **Explained project recommendations:** see why a skill was prioritized, choose a difficulty, reroll, and open a project brief with milestones and learning resources.
- **Project plan:** save a recommendation and move it through planned, in progress, and completed, with an optional repository link.
- **Manual practice:** record a course, local project, coding challenge, or other learning activity absent from GitHub.
- **Learning notes:** the original algorithm notes and interactive diagrams remain available as a reference library.
- **Useful from first launch:** illustrative demo data is labeled; demo edits are kept separate from live account data. SQLite is the default, so no services or credentials are needed to try it.
- **Portable data:** export your dashboard data as JSON. The API has OpenAPI documentation at `/docs`.

## What the numbers mean

A commit is evidence of activity, not a unit of expertise. CodePulse does **not** grade programming ability, read a developer's mind, or claim that an inactive skill has been forgotten.

GitHub REST is sampled within configured request and repository limits. This is not a reconstruction of the GitHub contribution graph or a complete audit of every repository, branch, review, organization, or private contribution. Commits are authored commits on sampled repositories' default branches, and pull requests are authored by the selected account; the import looks back up to 180 days. Only successfully fetched records are shown, and sync coverage and warnings are displayed. A repository's primary language or dependencies do not prove that every commit practiced every assigned skill; repository-level categorization is a heuristic. Manual entries are self-reported.

A public username connection is a local workspace for inspecting public data; it is not a verified identity. Optional OAuth verifies the connected GitHub account. Private repositories are excluded unless the operator explicitly opts in and the GitHub permission grant allows access.

## Architecture and preserved layout

```text
GitHub REST API
      │
      ▼
poller/                    bounded fetching and optional scheduled refresh
      │
      ▼
backend/                   sessions, storage, API, optional queue worker
      │
      ├── ml/              classification, analytics, project scoring
      │
      ▼
dashboard/                 React + Vite, charts, planner, settings, notes
```

```text
backend/       FastAPI app, SQLite/PostgreSQL persistence, sessions, optional Redis queue/worker
poller/        GitHub client, sync orchestration, optional scheduler
ml/            Skill catalog, analytics, recommendation catalog/scoring, demo fixtures

dashboard/
  src/
    components/  Reused chart/feed/recommendation component structure
    pages/       Dashboard and feature pages
    notes/       Preserved algorithm notes, SVG diagrams, and rendering kit
scripts/       Local development launcher
tests/         API, GitHub integration, and analytics tests
.env.example   Configuration template; contains no credentials
Dockerfile     Builds the UI and runs one same-origin application
```

The old personal profile, production API URL, LeetCode cookies, and SQL data dump are not used by CodePulse. See [CHANGELOG.md](CHANGELOG.md) for the migration summary.

## Local development

Prerequisites: Python 3.11+ (3.12 recommended), Node.js 22.12+ or 24 LTS, and npm. Run commands from the project root unless shown otherwise.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
npm --prefix dashboard ci
python scripts/run.py
```

On Windows, use `py -m venv .venv`, `.\.venv\Scripts\Activate.ps1`, and `Copy-Item .env.example .env`. The launcher uses the active Python interpreter and stops both child services when you press Ctrl+C.

Open **http://localhost:5173**. The Vite development server forwards `/api` to FastAPI at port 8000. Keep the hostname consistent: switching between `localhost` and `127.0.0.1` changes cookie and OAuth origins.

To run separately:

```bash
uvicorn backend.main:app --reload --port 8000
```

```bash
cd dashboard
npm run dev
```

Frontend source changes reload automatically. API documentation is at **http://localhost:8000/docs**. The backend creates its local database and signing/encryption key under `data/`; keep that folder private and do not commit it. Deleting it removes locally stored accounts, settings, projects, sessions, and the local key.

## Configuration

Copy `.env.example` to `.env` in the root. Most settings are optional.

| Variable | Purpose |
| --- | --- |
| `CODEPULSE_DATA_DIR` | Local data directory, default `data`. |
| `DATABASE_URL` | Optional `postgresql://...` or SQLite URL. Omit for the default local database. |
| `APP_URL` | Public backend origin, default `http://localhost:8000`; used for OAuth callback URLs. |
| `FRONTEND_URL` | Allowed frontend origin and OAuth return location, default `http://localhost:5173`. Use the same origin as `APP_URL` for the built production app. |
| `COOKIE_SECURE` | `false` for local HTTP; set `true` behind production HTTPS. |
| `SECRET_KEY` | Persistent secret of at least 32 characters. Local runs generate `data/.secret` if unset. Set an explicit private value in production. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth App credentials. Keep them server-side. |
| `GITHUB_INCLUDE_PRIVATE` | Default `false`; opt into private repository permission requests when using OAuth. |
| `GITHUB_MAX_REPOS` | Maximum sampled repositories per sync; default 12, maximum 100. |
| `GITHUB_REQUEST_BUDGET` | Request cap per sync; defaults to 50 unauthenticated or 400 authenticated. |
| `GITHUB_MAX_COMMITS_PER_REPO` | Per-repository authored commit cap, default 200. |
| `GITHUB_MAX_PULL_REQUESTS` | Authored pull request cap, default 200. |
| `REDIS_URL` | Optional background queue for separately run worker/scheduler services. |

Backend credentials never belong in `dashboard/.env`. Variables beginning with `VITE_` are bundled into browser JavaScript and are public.

### Optional GitHub OAuth

1. Create an OAuth App at [GitHub Developer Settings](https://github.com/settings/developers).
2. For local development, set its homepage to `http://localhost:5173` and authorization callback to **`http://localhost:8000/api/auth/callback`**.
3. Put the client ID and secret into the root `.env`, then restart FastAPI.
4. Use GitHub sign-in in the connection dialog.

For production, replace the callback origin with your HTTPS `APP_URL`, set `FRONTEND_URL` to the deployed UI origin, set `COOKIE_SECURE=true`, and keep `SECRET_KEY` stable across restarts. OAuth state is validated and tokens stay on the server. Private repository access is optional and requests broader GitHub permissions only when enabled.

### PostgreSQL and background jobs

PostgreSQL is optional. Point `DATABASE_URL` to an empty database and the application initializes its own tables. Use a persistent database or disk in production.

The original separate process layout remains available. The scheduler refreshes connected workspaces every ten minutes. Without Redis it refreshes inline; with `REDIS_URL` it enqueues work for a separate worker:

```bash
python -m backend.worker
python -m poller.scheduler
```

These are optional operational services. The normal sync button performs a foreground refresh without Redis. Use `python -m poller.scheduler --once` for a single refresh pass. Do not start multiple schedulers for the same queue unless you intend to enqueue duplicate work.

## How recommendations work

This is a transparent weighted scoring model, not a trained ML model. It compares each skill's observed practice share with your chosen target and considers recency. Skills outside your target mix are not a learning obligation. Recommendations include their reasons and difficulty, plus a small project brief rather than a vague instruction to "practice more."

Classification and scoring live in `ml/`. You can adjust the catalog, skill mappings, and weights there. Activity trends compare equivalent windows, and last-practiced dates describe observed evidence. Neither is a proficiency score.

## API overview

All application routes are under `/api`; `/docs` describes request schemas and responses.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/dashboard?days=30` | Dashboard for the current session; supported windows are 30, 90, and 180 days. |
| GET | `/api/config` | Whether GitHub OAuth is configured. |
| POST | `/api/connect` | Create a public-username workspace and sync it. |
| GET | `/api/auth/github` | Start optional GitHub OAuth. |
| GET | `/api/auth/callback` | Validate OAuth state and complete account connection. |
| POST | `/api/sync` | Refresh the current GitHub snapshot. |
| POST | `/api/disconnect` | Clear the current connection and return to demo mode. |
| PUT | `/api/settings` | Save target shares and weekly goal. |
| GET | `/api/recommendations` | Get projects with difficulty and exclusion filters. |
| POST / PATCH / DELETE | `/api/projects` / `/api/projects/{id}` | Save, update, or remove planned projects. |
| POST | `/api/practice` | Add a manual practice entry. |
| GET | `/api/export` | Download current dashboard data as JSON. |

Workspaces are scoped to the browser session, not a reusable CodePulse account. Sessions use HTTP-only cookies and expire after 30 days. Connecting replaces the current demo workspace; disconnecting deletes the current connected workspace and token and starts a fresh demo. Export anything you want to retain before switching or disconnecting. Mutation requests must send `X-CodePulse-Request: 1` and come from an allowed browser origin; the frontend does this automatically. The recommended same-origin deployment avoids cross-site cookie issues. Connections and syncs are also rate-limited; a live sync can be retried after one minute.

## Checks

```bash
# From the project root, virtual environment active
python -m pytest tests -q
python dashboard/scripts/check_notes.py

# Frontend interaction checks in a simulated DOM (no browser or server)
npm --prefix dashboard test

# Production frontend bundle
npm --prefix dashboard run build
```

The GitHub tests use mocked responses instead of consuming API quota or requiring credentials. Frontend checks use jsdom, mocked API responses generated from fictional demo analytics, React interactions, and Vite module transforms without opening a browser or listening on an HTTP port. They cover navigation, repository filters, manual entries, difficulty and window handling, rerolls, saved projects, settings, connection validation, and recoverable errors. They do not verify visual layout or real GitHub sign-in. Analytics tests exercise empty data, time windows, classification, targets, and recommendation filters. A real OAuth handshake still requires your own registered GitHub OAuth App.

## Production: one origin

The simplest deployment serves the built dashboard and API from FastAPI:

```bash
npm --prefix dashboard ci
npm --prefix dashboard run build
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000`. For this configuration set `APP_URL=http://localhost:8000` and `FRONTEND_URL=http://localhost:8000`. On a public server, use your actual HTTPS origin, a persistent `SECRET_KEY`, secure cookies, and persistent storage. Run behind a reverse proxy or hosting provider that terminates HTTPS.

Do not use `vite preview` as the production API server: it does not replace FastAPI.

### Docker

```bash
cp .env.example .env
# Set APP_URL and FRONTEND_URL both to http://localhost:8000 for this local Docker run.
docker compose up --build
```

Open **http://localhost:8000**. A named volume retains local data and the generated key across restarts. `docker compose down` retains it; `docker compose down --volumes` deletes it.

The optional `postgres` Compose profile starts PostgreSQL. Set a private `POSTGRES_PASSWORD` and matching `DATABASE_URL=postgresql://codepulse:YOUR_PASSWORD@postgres:5432/codepulse` in `.env`, then run `docker compose --profile postgres up --build`. The normal SQLite path is enough for a personal deployment.

### Railway / other hosts

The web start command is `python -m backend.server`. It reads `PORT` from the environment directly, so it also works when a hosting platform launches the process without a shell.

If an existing Railway web service crashes with `'$PORT' is not a valid integer`, open that service's **Settings → Deploy → Custom Start Command**, replace its old command with `python -m backend.server`, and deploy the latest commit. Keep the service root directory at the repository root and use the included Dockerfile. This setting applies to the web service only; worker and scheduler commands stay as documented above.


`Dockerfile` and `railway.json` support a single app service. Set the HTTPS origins and secrets through the provider's environment settings. Mount persistent storage at `/app/data` or configure managed PostgreSQL. Do not rely on an ephemeral filesystem for sessions or encrypted OAuth tokens. Configure the GitHub OAuth callback to match your deployed origin. Optional workers can run as additional services using the same database, key, and Redis queue.

A separate Vercel frontend is possible, but requires correct API routing and cookie handling. Prefer a same-origin `/api` reverse proxy to the backend; use your own deployment's API URL rather than the old tracker URL. Cross-site cookies are affected by browser privacy policies, so a direct unrelated frontend/backend domain split is not the default setup here.

## Extending the project

Useful next steps include per-file skill evidence, deeper dependency analysis, an editable repository classification UI, GitHub App authorization for narrower repository access, richer background jobs, and deployment-specific account management. Keep coverage transparent as you add more data sources.

## Attribution

Adapted from the user-provided LeetCode tracker project, including its React component structure and algorithm notes/diagram library. The uploaded source did not include a license file. No new ownership or license over the original author's work is asserted; obtain the author's permission before redistributing or publishing it under a license.

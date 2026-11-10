# Start CodePulse

This is the complete source project. Keep this folder together: `backend/`, `poller/`, `ml/`, and `dashboard/` work as one app.

## 1. Install prerequisites

- Python 3.11 or newer (3.12 recommended).
- Node.js 22.12+ or Node.js 24 LTS, including npm.

## 2. Install the project

Open a terminal in this folder.

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
cd dashboard
npm ci
cd ..
```

**Windows PowerShell**

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
cd dashboard
npm ci
cd ..
```

If PowerShell prevents activation, run `.\.venv\Scripts\python.exe` in place of `python`, including for package installation (`.\.venv\Scripts\python.exe -m pip install -r requirements.txt`).

## 3. Run it

From the project root, with the virtual environment active:

```bash
python scripts/run.py
```

Open **http://localhost:5173**. The dashboard starts with clearly marked illustrative data. No GitHub credentials, PostgreSQL, or Redis are required.

To run the two services separately instead:

```bash
# Terminal 1 — project root, virtual environment active
uvicorn backend.main:app --reload --port 8000
```

```bash
# Terminal 2 — project root
cd dashboard
npm run dev
```

## 4. Use your GitHub activity

Choose **Connect GitHub** and enter a public GitHub username. This reads public activity; it does not prove you own that account. Syncs can take a little time and are bounded to protect GitHub rate limits. The dashboard explains what was sampled.

For verified GitHub sign-in, set up the optional OAuth credentials described in [README.md](README.md). Never paste a token into frontend code.

Set your target practice mix, choose a recommendation difficulty, and save a project to your plan. You can add manual practice for learning that GitHub does not capture. Demo changes stay separate from live data. Connecting replaces the demo workspace; disconnecting removes the current workspace and returns to a fresh demo. Use Export to keep a copy before switching.

## Where to go next

- [README.md](README.md): architecture, configuration, API, tests, deployment, and limits.
- [.env.example](.env.example): backend settings.
- [CHANGELOG.md](CHANGELOG.md): what changed from the original tracker.

CodePulse reports evidence of practice, not programming proficiency.

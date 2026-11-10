# Conversion to CodePulse

## Preserved

- The `backend/`, `poller/`, `ml/`, and `dashboard/` top-level organization.
- Python + FastAPI and React + Vite + JSX.
- Chart/feed/recommendation component roles and the hash-based page router.
- The original algorithm notes, interactive SVG diagrams, rendering kit, and notes validation script.
- Optional PostgreSQL, Redis worker, and scheduler process layout.

## Replaced or added

- GitHub REST integration in place of LeetCode cookies and submission polling.
- Public account inspection and optional GitHub OAuth, with server-side sessions and token handling.
- SQLite for first-run persistence without a database service, with optional PostgreSQL.
- GitHub commits, pull requests, repositories, languages, coverage notices, and weekly analytics.
- Practice categories: frontend, backend, databases, algorithms, and systems.
- Adjustable target distribution and weekly active-day goal.
- Explained, difficulty-filtered project recommendations with reroll and milestones.
- Saved project planning, manual practice entries, JSON export, and a labeled fictional demo.
- Responsive CodePulse dashboard, navigation, configuration, and deployment setup.
- Automated analytics, API, and GitHub client tests.

## Data and identity

- The original personal SQL dump and hard-coded profile/production API identity were removed from the converted project.
- LeetCode session credentials are no longer required.
- Demo data is illustrative and distinct from live account data.
- Activity is described as evidence of practice rather than a proficiency measurement.

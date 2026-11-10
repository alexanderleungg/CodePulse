# CodePulse dashboard

React 19 + Vite + Recharts frontend. This keeps the original tracker's JavaScript/JSX structure, chart components, hash router, and algorithm notes library.

Start with the [root quick-start guide](../START_HERE.md) so the FastAPI backend is running too.

```bash
npm ci
npm run dev
```

Open http://localhost:5173. Development requests to `/api` are proxied to FastAPI at http://localhost:8000. The default frontend never calls the original author's deployed tracker API.

```bash
npm test       # Simulated DOM user-flow checks; no browser or HTTP server
npm run build # Production bundle
```

This creates `dist/`. From the project root, FastAPI can serve that bundle alongside `/api` for a single-origin production app. Configure production origins in the root `.env`; `vite preview` is not an API server.

- `src/App.jsx`: session data, navigation, connection flow.
- `src/pages/`: dashboard and feature views.
- `src/components/`: reusable charts, activity feed, recommendation cards, and goal views.
- `src/notes/`: preserved algorithm content, diagrams, and rendering helpers.
- `src/api.js`: shared backend requests.
- `src/index.css`: responsive CodePulse visual system.

Optional frontend configuration is documented in `.env.example`. Never put GitHub tokens, OAuth secrets, or database credentials in a `VITE_` variable: these are public browser values.

The interaction fixture in `scripts/fixtures/demo.json` is fictional data generated from `ml.demo.demo_snapshot`, `ml.analytics.build_dashboard`, and the recommendation catalog at a fixed date. The harness tests state and user flows, not visual layout.

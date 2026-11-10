# Validation

Validated in a Linux environment with Python 3.12 and Node.js 24.

- Backend/analytics: 47 automated tests pass. These cover API sessions and isolation, CSRF boundary, project persistence, manual practice, date windows, recommendations, encrypted tokens, and mocked GitHub pagination/error/coverage behavior.
- All 27 preserved algorithm notes pass the original note/diagram validation script.
- Production frontend bundle builds successfully.
- Simulated DOM interaction tests pass for 10 user flows: navigation, manual practice, repository filtering, recommendation difficulty/save/reroll, project status, preferences, GitHub connection, errors, and retry.
- Component render checks pass for 30/90/180-day calendars, project explanations/actions, empty goals, and manual activity.
- A clean temporary database passes a production static UI/API session smoke test.
- A read-only live GitHub probe against the public `octocat` profile succeeded (2 sampled repositories, 9 requests). This dormant account returned no recent activity; the intentional sample cap was correctly marked as incomplete. Live data from this probe is not included in the package.

## Verification limits

A graphical browser preview could not be run: this environment's preview relay and required browser-control runtime were unavailable. DOM interaction checks and render checks do not verify visual layout in a real browser. Check desktop/mobile appearance when you run the app locally.

GitHub OAuth is implemented and tested with mocked token responses. An actual sign-in needs your own GitHub OAuth App credentials. PostgreSQL, Redis background processing, and Docker configuration were not verified against running external services here. SQLite and ordinary foreground syncing do not require those services.

## Repeat the checks

From the root with the Python environment active:

```bash
python -m pytest tests -q
python dashboard/scripts/check_notes.py
npm --prefix dashboard run build
node dashboard/src/components/check-render.mjs
npm --prefix dashboard test
```

"""Request-level tests; every GitHub call is mocked and workspaces are temporary."""
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

WRITE = {"X-CodePulse-Request": "1", "Origin": "http://localhost:5173"}


@pytest.fixture

def app_env(tmp_path, monkeypatch):
    monkeypatch.setenv("CODEPULSE_DATA_DIR", str(tmp_path))
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("SECRET_KEY", "test-secret-key-with-more-than-thirty-two-characters")
    from backend.security import secret_key
    secret_key.cache_clear()
    from backend import main
    main.IMPORT_TIMES.clear()
    monkeypatch.setattr(main, "SECURE_COOKIE", False)
    yield main
    secret_key.cache_clear()


@pytest.fixture

def client(app_env):
    with TestClient(app_env.app) as test_client:
        yield test_client


def test_demo_is_usable_and_browser_cookie_is_private(client):
    response = client.get("/api/dashboard?days=90")
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "demo"
    assert data["window_days"] == 90
    assert len(data["skills"]) == 5
    assert data["recommendations"]
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "SameSite=lax" in response.headers["set-cookie"]
    assert response.headers["cache-control"] == "no-store"
    assert client.get("/api/dashboard?days=7").status_code == 422


def test_mutations_reject_cross_origin_and_missing_custom_header(client):
    client.get("/api/dashboard")
    assert client.post("/api/disconnect").status_code == 403
    assert client.post("/api/disconnect", headers={**WRITE, "Origin": "https://attacker.invalid"}).status_code == 403
    assert client.post("/api/disconnect", headers={**WRITE, "Sec-Fetch-Site": "cross-site"}).status_code == 403
    assert client.post("/api/disconnect", headers=WRITE).status_code == 200


def test_settings_are_validated_and_persist_only_in_their_workspace(client, app_env):
    client.get("/api/dashboard")
    settings = {"targets": {"frontend": 20, "backend": 20, "databases": 20, "algorithms": 20, "systems": 20}, "weekly_goal": 6}
    saved = client.put("/api/settings", json=settings, headers=WRITE)
    assert saved.status_code == 200
    assert client.get("/api/dashboard").json()["settings"] == settings
    assert client.put("/api/settings", json={**settings, "weekly_goal": 8}, headers=WRITE).status_code == 422
    assert client.put("/api/settings", json={**settings, "targets": {"frontend": 100}}, headers=WRITE).status_code == 422
    with TestClient(app_env.app) as another:
        assert another.get("/api/dashboard").json()["settings"]["weekly_goal"] == 4


def test_manual_practice_is_recorded_and_future_date_rejected(client):
    today = datetime.now(timezone.utc).date().isoformat()
    response = client.post("/api/practice", json={"skill_id": "systems", "date": today, "title": "Practiced Linux sockets"}, headers=WRITE)
    assert response.status_code == 200
    manual = [event for event in response.json()["feed"] if event["type"] == "manual"]
    assert manual and manual[0]["title"] == "Practiced Linux sockets"
    bad = client.post("/api/practice", json={"skill_id": "systems", "date": "2999-01-01", "title": "Future"}, headers=WRITE)
    assert bad.status_code == 422


def test_rerolled_project_can_be_saved_then_updated_deleted(client):
    initial = client.get("/api/recommendations?difficulty=beginner").json()
    rerolled = client.get("/api/recommendations", params={"difficulty": "beginner", "exclude": ",".join(item["id"] for item in initial)}).json()
    assert rerolled[0]["id"] != initial[0]["id"]
    identifier = rerolled[0]["id"]
    saved = client.post("/api/projects", json={"project_id": identifier}, headers=WRITE)
    assert saved.status_code == 200
    assert saved.json()["projects"][0]["id"] == identifier
    assert client.post("/api/projects", json={"project_id": identifier}, headers=WRITE).json()["projects"] == saved.json()["projects"]
    updated = client.patch(f"/api/projects/{identifier}", json={"status": "completed", "repo_url": "https://github.com/dev/project"}, headers=WRITE)
    assert updated.status_code == 200
    assert updated.json()["projects"][0]["status"] == "completed"
    status_only = client.patch(f"/api/projects/{identifier}", json={"status": "in_progress"}, headers=WRITE)
    assert status_only.json()["projects"][0]["repo_url"] == "https://github.com/dev/project"
    assert client.patch(f"/api/projects/{identifier}", json={"status": "planned", "repo_url": "javascript:alert(1)"}, headers=WRITE).status_code == 422
    assert client.delete(f"/api/projects/{identifier}", headers=WRITE).json()["projects"] == []


def test_public_connect_rotates_session_does_not_authenticate_or_merge_demo(client):
    client.get("/api/dashboard")
    old_cookie = client.cookies.get("codepulse_session")
    snapshot = {"profile": {"login": "dev", "name": "Developer"}, "repositories": [], "events": [], "synced_at": datetime.now(timezone.utc).isoformat(), "notices": [], "coverage": {}}
    with patch("backend.main.GitHubClient.sync", return_value=snapshot) as sync:
        response = client.post("/api/connect", json={"username": "dev"}, headers=WRITE)
    assert response.status_code == 200
    assert response.json()["mode"] == "live"
    assert response.json()["connection"] == {"method": "public", "verified": False}
    assert response.json()["summary"]["commits"] == 0
    assert old_cookie != client.cookies.get("codepulse_session")
    sync.assert_called_once_with("dev")
    assert client.post("/api/sync", headers=WRITE).status_code == 429


def test_disconnect_erases_workspace_and_export_contains_no_secrets(client):
    client.get("/api/dashboard")
    old_cookie = client.cookies.get("codepulse_session")
    exported = client.get("/api/export")
    assert exported.status_code == 200
    assert "attachment" in exported.headers["content-disposition"]
    assert "token" not in exported.json()
    response = client.post("/api/disconnect", headers=WRITE)
    assert response.json()["mode"] == "demo"
    from backend.db import get_session
    assert get_session(old_cookie) is None


def test_oauth_state_required_and_consumed_even_when_denied(client, monkeypatch):
    monkeypatch.setenv("GITHUB_CLIENT_ID", "client")
    monkeypatch.setenv("GITHUB_CLIENT_SECRET", "client-secret")
    response = client.get("/api/auth/github", follow_redirects=False)
    assert response.status_code == 302
    assert response.headers["location"].startswith("https://github.com/login/oauth/authorize?")
    assert client.get("/api/auth/callback?code=abc&state=bad").status_code == 400
    from backend.db import get_session
    state = get_session(client.cookies.get("codepulse_session"))["oauth_state"]
    denied = client.get("/api/auth/callback", params={"state": state, "error": "access_denied"}, follow_redirects=False)
    assert denied.status_code == 302
    assert client.get("/api/auth/callback", params={"state": state, "code": "abc"}).status_code == 400


def test_oauth_token_is_encrypted_and_not_returned_to_browser(client, monkeypatch):
    monkeypatch.setenv("GITHUB_CLIENT_ID", "client")
    monkeypatch.setenv("GITHUB_CLIENT_SECRET", "client-secret")
    client.get("/api/auth/github", follow_redirects=False)
    from backend.db import get_session
    state = get_session(client.cookies.get("codepulse_session"))["oauth_state"]
    snapshot = {"profile": {"login": "dev"}, "repositories": [], "events": [], "synced_at": datetime.now(timezone.utc).isoformat(), "notices": [], "coverage": {}}
    with patch("backend.main.requests.post") as exchange, patch("backend.main.GitHubClient.profile", return_value={"login": "dev"}), patch("backend.main.GitHubClient.sync", return_value=snapshot):
        exchange.return_value.json.return_value = {"access_token": "server-only-token"}
        response = client.get("/api/auth/callback", params={"state": state, "code": "abc"}, follow_redirects=False)
    assert response.status_code == 302
    stored = get_session(client.cookies.get("codepulse_session"))
    assert stored["token"] != "server-only-token"
    from backend.security import decrypt_token
    assert decrypt_token(stored["token"]) == "server-only-token"
    visible = client.get("/api/dashboard")
    assert "server-only-token" not in visible.text
    assert visible.json()["connection"]["verified"] is True


def test_public_connect_validates_username_before_network(client):
    with patch("backend.main.GitHubClient.sync") as sync:
        assert client.post("/api/connect", json={"username": "../../escape"}, headers=WRITE).status_code == 422
        sync.assert_not_called()


def test_recommendations_and_saved_reason_follow_selected_window(client):
    client.get("/api/dashboard")
    from backend import db
    now = datetime.now(timezone.utc)
    events = [{"id": "front", "type": "commit", "repo": "dev/app", "title": "Frontend work", "url": "", "date": now.isoformat(), "skills": ["frontend"]}]
    events += [{"id": f"back-{i}", "type": "commit", "repo": "dev/api", "title": "Backend work", "url": "", "date": (now - timedelta(days=45+i)).isoformat(), "skills": ["backend"]} for i in range(4)]
    snapshot = {"profile": {"login": "dev"}, "repositories": [], "events": events, "synced_at": now.isoformat(), "notices": [], "coverage": {}}
    db.mutate_session(client.cookies.get("codepulse_session"), lambda state: state.update(mode="live", snapshot=snapshot, username="dev"))
    monthly = client.get("/api/recommendations?days=30").json()
    quarterly = client.get("/api/recommendations?days=90").json()
    monthly_backend = next(item for item in monthly if item["skill_id"] == "backend")
    quarterly_backend = next(item for item in quarterly if item["skill_id"] == "backend")
    assert monthly_backend["reason"] != quarterly_backend["reason"]
    assert monthly_backend["score"] != quarterly_backend["score"]
    saved = client.post("/api/projects?days=90", json={"project_id": quarterly_backend["id"]}, headers=WRITE)
    assert saved.status_code == 200
    assert saved.json()["window_days"] == 90
    project = saved.json()["projects"][0]
    assert project["reason"] == quarterly_backend["reason"]
    assert project["score"] == quarterly_backend["score"]
    assert project["score_breakdown"] == quarterly_backend["score_breakdown"]
    assert client.post("/api/projects?days=7", json={"project_id": quarterly_backend["id"]}, headers=WRITE).status_code == 422

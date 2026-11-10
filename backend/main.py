"""CodePulse API: private browser workspaces, GitHub import, and growth planning."""
import copy
import json
import logging
import os
import re
import secrets
import threading
import time
import uuid
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from enum import IntEnum
from pathlib import Path
from typing import Literal
from urllib.parse import urlencode, urlparse

import requests
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend import db
from backend.security import decrypt_token, encrypt_token, secret_key
from ml.analytics import build_dashboard
from ml.demo import demo_snapshot
from ml.recommender import get_recommendations, get_project
from poller.poller import GitHubClient, GitHubError

LOGGER = logging.getLogger("codepulse")
COOKIE = "codepulse_session"
SKILL_IDS = {"frontend", "backend", "databases", "algorithms", "systems"}
APP_URL = os.getenv("APP_URL", "http://localhost:8000").rstrip("/")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
ORIGINS = list(dict.fromkeys([APP_URL, FRONTEND_URL]))
SECURE_COOKIE = os.getenv("COOKIE_SECURE", str(APP_URL.startswith("https://"))).lower() == "true"
LIMIT_LOCK = threading.Lock()
IMPORT_TIMES = {}


@asynccontextmanager
async def lifespan(_app):
    db.ensure_schema()
    secret_key()  # Fail early on invalid configuration; create persistent development key.
    yield


app = FastAPI(title="CodePulse API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=ORIGINS, allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-CodePulse-Request"],
)


@app.middleware("http")
async def browser_boundary(request: Request, call_next):
    if request.url.path.startswith("/api") and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        # A custom header cannot be sent by cross-origin forms. Cross-origin JS
        # cannot send it unless the CORS preflight is explicitly allowed.
        origin = request.headers.get("origin")
        if request.headers.get("x-codepulse-request") != "1" or (origin and origin not in ORIGINS):
            return JSONResponse({"detail": "Request origin could not be verified."}, status_code=403)
        if request.headers.get("sec-fetch-site") == "cross-site":
            return JSONResponse({"detail": "Cross-site writes are not allowed."}, status_code=403)
    response = await call_next(request)
    if request.url.path.startswith("/api"):
        response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "DENY"
    return response


@app.exception_handler(GitHubError)
async def github_error(_request, exc):
    return JSONResponse({"detail": str(exc)}, status_code=exc.status_code)


@app.exception_handler(KeyError)
async def expired_session(_request, _exc):
    return JSONResponse({"detail": "This workspace expired. Reload to start a new session."}, status_code=401)


def cookie(response, session_id):
    response.set_cookie(COOKIE, session_id, max_age=db.SESSION_SECONDS,
                        httponly=True, secure=SECURE_COOKIE, samesite="lax", path="/")


def workspace(request: Request, response: Response):
    session_id = request.cookies.get(COOKIE)
    state = db.get_session(session_id)
    if state is None:
        session_id = db.create_session()
        state = db.get_session(session_id)
        cookie(response, session_id)
    return session_id, state


def dashboard(state, days=30):
    snapshot = copy.deepcopy(state.get("snapshot") or demo_snapshot())
    snapshot.setdefault("events", []).extend(state.get("manual", []))
    result = build_dashboard(snapshot, state["settings"], state["projects"], days=days, mode=state["mode"])
    if state["mode"] == "live":
        verified = bool(state.get("token"))
        result["connection"] = {"method": "oauth" if verified else "public", "verified": verified}
    else:
        result["connection"] = {"method": "demo", "verified": False}
    return result


def import_limit(request):
    client = request.client.host if request.client else "unknown"
    now = time.time()
    with LIMIT_LOCK:
        for address in list(IMPORT_TIMES):
            IMPORT_TIMES[address] = [t for t in IMPORT_TIMES[address] if now - t < 60]
            if not IMPORT_TIMES[address]:
                del IMPORT_TIMES[address]
        previous = IMPORT_TIMES.setdefault(client, [])
        if len(previous) >= 5:
            raise HTTPException(429, "Too many imports. Wait a minute before trying again.")
        previous.append(now)


class WindowDays(IntEnum):
    month = 30
    quarter = 90
    half_year = 180


class Payload(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Connect(Payload):
    username: str = Field(min_length=1, max_length=39, pattern=r"^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$")


class Settings(Payload):
    targets: dict[str, int]
    weekly_goal: int = Field(ge=1, le=7)

    @field_validator("targets")
    @classmethod
    def valid_targets(cls, value):
        if set(value) != SKILL_IDS or any(v < 0 or v > 100 for v in value.values()) or sum(value.values()) != 100:
            raise ValueError("Set each of the five skill targets between 0 and 100; their total must be 100.")
        return value


class SaveProject(Payload):
    project_id: str = Field(min_length=1, max_length=100)


class ProjectUpdate(Payload):
    status: Literal["planned", "in_progress", "completed"]
    repo_url: str = Field(default="", max_length=250)

    @field_validator("repo_url")
    @classmethod
    def valid_repository(cls, value):
        if not value:
            return ""
        parsed = urlparse(value)
        if parsed.scheme != "https" or parsed.netloc != "github.com" or parsed.query or parsed.fragment or not re.fullmatch(r"/[\w.-]+/[\w.-]+/?", parsed.path):
            raise ValueError("Use a repository URL such as https://github.com/owner/project.")
        return value.rstrip("/")


class Practice(Payload):
    skill_id: Literal["frontend", "backend", "databases", "algorithms", "systems"]
    date: date
    title: str = Field(min_length=3, max_length=160)

    @field_validator("date")
    @classmethod
    def valid_date(cls, value):
        today = datetime.now(timezone.utc).date()
        if value > today or value < today - timedelta(days=3650):
            raise ValueError("Practice date must be within the last ten years and cannot be in the future.")
        return value

    @field_validator("title")
    @classmethod
    def meaningful_title(cls, value):
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Describe your practice in at least three characters.")
        return value


@app.get("/api/health")
def health():
    return {"status": "ok", "application": "CodePulse", "version": "1.0.0"}


@app.get("/api/config")
def config():
    return {"oauth_enabled": bool(os.getenv("GITHUB_CLIENT_ID") and os.getenv("GITHUB_CLIENT_SECRET"))}


@app.get("/api/dashboard")
def get_dashboard(days: WindowDays = WindowDays.month, current=Depends(workspace)):
    return dashboard(current[1], days)


@app.post("/api/connect")
def connect(body: Connect, request: Request, response: Response):
    import_limit(request)
    snapshot = GitHubClient().sync(body.username)
    state = db.new_document("live")
    state.update(snapshot=snapshot, username=snapshot["profile"]["login"], last_sync=time.time())
    session_id = db.create_session(state)
    db.delete_session(request.cookies.get(COOKIE))
    cookie(response, session_id)
    return dashboard(state)


@app.post("/api/sync")
def sync(request: Request, current=Depends(workspace)):
    session_id, state = current
    if state["mode"] == "demo":
        return dashboard(state)
    if time.time() - state.get("last_sync", 0) < 60:
        raise HTTPException(429, "Your snapshot is up to date. Wait one minute between syncs.")
    import_limit(request)
    try:
        token = decrypt_token(state.get("token"))
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc
    snapshot = GitHubClient(token).sync(state["username"])
    def update(document):
        document.update(snapshot=snapshot, last_sync=time.time())
    return dashboard(db.mutate_session(session_id, update))


@app.post("/api/disconnect")
def disconnect(request: Request, response: Response):
    db.delete_session(request.cookies.get(COOKIE))
    session_id = db.create_session()
    cookie(response, session_id)
    return dashboard(db.get_session(session_id))


@app.put("/api/settings")
def settings(body: Settings, current=Depends(workspace)):
    state = db.mutate_session(current[0], lambda document: document.update(settings=body.model_dump()))
    return dashboard(state)


@app.get("/api/recommendations")
def recommendations(difficulty: Literal["beginner", "intermediate", "advanced"] = "intermediate",
                    exclude: str = Query(default="", max_length=5000), days: WindowDays = WindowDays.month,
                    current=Depends(workspace)):
    skills = dashboard(current[1], days)["skills"]
    return get_recommendations(skills, difficulty=difficulty, exclude=exclude.split(",") if exclude else [])


@app.post("/api/projects")
def save_project(body: SaveProject, days: WindowDays = WindowDays.month, current=Depends(workspace)):
    skills = dashboard(current[1], days)["skills"]
    project = get_project(body.project_id)
    if project:
        context = next((item for item in get_recommendations(skills, difficulty=project["difficulty"])
                        if item["skill_id"] == project["skill_id"]), None)
        if context:
            project.update({key: context[key] for key in ("reason", "score", "score_breakdown") if key in context})
        else:
            project.update(reason="A project you selected for focused practice.", score=0)
    if not project:
        raise HTTPException(404, "This project is not in the recommendation catalog.")
    def update(document):
        if any(item["id"] == body.project_id for item in document["projects"]):
            return
        if len(document["projects"]) >= 100:
            raise HTTPException(400, "Your workspace can hold up to 100 saved projects.")
        document["projects"].append({**project, "status": "planned", "repo_url": "", "created_at": datetime.now(timezone.utc).isoformat()})
    return dashboard(db.mutate_session(current[0], update), days)


@app.patch("/api/projects/{project_id}")
def update_project(project_id: str, body: ProjectUpdate, current=Depends(workspace)):
    def update(document):
        project = next((item for item in document["projects"] if item["id"] == project_id), None)
        if project is None:
            raise HTTPException(404, "Saved project not found.")
        project.update(body.model_dump(exclude_unset=True))
    return dashboard(db.mutate_session(current[0], update))


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, current=Depends(workspace)):
    def update(document):
        document["projects"] = [item for item in document["projects"] if item["id"] != project_id]
    return dashboard(db.mutate_session(current[0], update))


@app.post("/api/practice")
def practice(body: Practice, current=Depends(workspace)):
    event = {"id": f"manual:{uuid.uuid4()}", "type": "manual", "title": body.title,
             "date": body.date.isoformat() + "T00:00:00+00:00", "repo": "Manual learning entry", "url": "",
             "skills": [body.skill_id]}
    def update(document):
        if len(document["manual"]) >= 5000:
            raise HTTPException(400, "Your workspace can hold up to 5,000 manual practice entries.")
        document["manual"].append(event)
    return dashboard(db.mutate_session(current[0], update))


@app.get("/api/export")
def export(days: WindowDays = WindowDays.half_year, current=Depends(workspace)):
    content = dashboard(current[1], days)
    return Response(json.dumps(content, indent=2), media_type="application/json",
                    headers={"Content-Disposition": 'attachment; filename="codepulse-export.json"'})


@app.get("/api/auth/github")
def github_auth(request: Request):
    if not config()["oauth_enabled"]:
        raise HTTPException(503, "GitHub OAuth is not configured. Connect a public username instead.")
    session_id = request.cookies.get(COOKIE)
    if db.get_session(session_id) is None:
        session_id = db.create_session()
    state = secrets.token_urlsafe(32)
    db.mutate_session(session_id, lambda document: document.update(oauth_state=state, oauth_expires=time.time() + 600))
    private = os.getenv("GITHUB_INCLUDE_PRIVATE", "false").lower() == "true"
    params = {"client_id": os.environ["GITHUB_CLIENT_ID"], "redirect_uri": APP_URL + "/api/auth/callback",
              "scope": "read:user repo" if private else "read:user", "state": state}
    response = RedirectResponse("https://github.com/login/oauth/authorize?" + urlencode(params), status_code=302)
    cookie(response, session_id)
    return response


@app.get("/api/auth/callback")
def github_callback(request: Request, code: str = "", state: str = "", error: str = ""):
    session_id = request.cookies.get(COOKIE)
    document = db.get_session(session_id)
    expected = (document or {}).get("oauth_state", "")
    if not expected or not state or not secrets.compare_digest(expected, state) or (document or {}).get("oauth_expires", 0) < time.time():
        raise HTTPException(400, "GitHub sign-in expired or the state did not match. Start sign-in again.")
    def consume(value):
        value.pop("oauth_state", None)
        value.pop("oauth_expires", None)
    db.mutate_session(session_id, consume)
    if error or not code:
        return RedirectResponse(FRONTEND_URL + "/?auth_error=denied#/", status_code=302)
    try:
        result = requests.post("https://github.com/login/oauth/access_token", json={
            "client_id": os.environ["GITHUB_CLIENT_ID"], "client_secret": os.environ["GITHUB_CLIENT_SECRET"],
            "code": code, "redirect_uri": APP_URL + "/api/auth/callback",
        }, headers={"Accept": "application/json"}, timeout=20, allow_redirects=False)
        result.raise_for_status()
        granted = result.json()
        token = granted.get("access_token") if isinstance(granted, dict) else None
        if not isinstance(token, str) or not token or len(token) > 4096:
            raise HTTPException(400, "GitHub did not grant access. Start sign-in again.")
    except (requests.RequestException, ValueError) as exc:
        raise HTTPException(502, "Could not complete GitHub sign-in. Try again.") from exc
    client = GitHubClient(token)
    profile = client.profile()
    snapshot = client.sync(profile["login"])
    connected = db.new_document("live")
    connected.update(snapshot=snapshot, username=profile["login"], token=encrypt_token(token), last_sync=time.time())
    new_id = db.create_session(connected)
    db.delete_session(session_id)
    response = RedirectResponse(FRONTEND_URL + "/#/", status_code=302)
    cookie(response, new_id)
    return response


# A build can be served by the API itself, avoiding CORS and split-domain cookies.
DIST = Path(__file__).resolve().parents[1] / "dashboard" / "dist"
if DIST.is_dir():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="dashboard")
else:
    @app.get("/")
    def root():
        return {"application": "CodePulse", "docs": "/docs", "dashboard": "Run npm run dev in dashboard/, or npm run build to serve it here."}

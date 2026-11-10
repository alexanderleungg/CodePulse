"""Small JSON-document store with interchangeable SQLite and PostgreSQL adapters.

A random browser session is the isolation boundary. A public GitHub username is
never treated as a login. No existing LeetCode tables or data are reused.
"""
import hashlib
import json
import os
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DEFAULT_SETTINGS = {
    "targets": {"frontend": 30, "backend": 25, "databases": 20, "algorithms": 15, "systems": 10},
    "weekly_goal": 4,
}
SESSION_SECONDS = 30 * 24 * 60 * 60


def data_dir():
    path = Path(os.getenv("CODEPULSE_DATA_DIR", "data"))
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    return path


def database_url():
    return os.getenv("DATABASE_URL", "")


def is_postgres():
    return database_url().startswith(("postgres://", "postgresql://"))


def sqlite_path():
    url = database_url()
    if url and not url.startswith("sqlite:///") and not is_postgres():
        raise ValueError("DATABASE_URL must use postgresql:// or sqlite:///")
    path = Path(url.removeprefix("sqlite:///")) if url else data_dir() / "codepulse.db"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def get_connection():
    if is_postgres():
        import psycopg2
        return psycopg2.connect(database_url(), connect_timeout=10)
    path = sqlite_path()
    # SQLite inherits file permissions for WAL sidecars. Keep local workspaces private.
    fd = os.open(path, os.O_CREAT | os.O_WRONLY, 0o600)
    os.close(fd)
    conn = sqlite3.connect(path, timeout=30)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def placeholder():
    return "%s" if is_postgres() else "?"


@contextmanager
def connection():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def ensure_schema():
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""CREATE TABLE IF NOT EXISTS codepulse_sessions (
            session_hash TEXT PRIMARY KEY,
            document TEXT NOT NULL,
            expires_at DOUBLE PRECISION NOT NULL
        )""")
        cursor.execute("CREATE INDEX IF NOT EXISTS codepulse_expiration ON codepulse_sessions(expires_at)")
        cursor.execute(f"DELETE FROM codepulse_sessions WHERE expires_at < {placeholder()}", (time.time(),))
        cursor.close()


def session_hash(session_id):
    return hashlib.sha256(session_id.encode()).hexdigest()


def new_document(mode="demo"):
    return {
        "mode": mode, "snapshot": None, "settings": json.loads(json.dumps(DEFAULT_SETTINGS)),
        "projects": [], "manual": [], "token": None, "username": None,
    }


def create_session(document=None):
    session_id = secrets.token_urlsafe(32)
    with connection() as conn:
        cursor = conn.cursor()
        p = placeholder()
        cursor.execute(f"DELETE FROM codepulse_sessions WHERE expires_at < {p}", (time.time(),))
        cursor.execute(f"INSERT INTO codepulse_sessions (session_hash, document, expires_at) VALUES ({p}, {p}, {p})",
                       (session_hash(session_id), json.dumps(document or new_document()), time.time() + SESSION_SECONDS))
        cursor.close()
    return session_id


def get_session(session_id):
    if not session_id or len(session_id) > 128:
        return None
    with connection() as conn:
        cursor = conn.cursor()
        p = placeholder()
        cursor.execute(f"SELECT document FROM codepulse_sessions WHERE session_hash={p} AND expires_at>{p}",
                       (session_hash(session_id), time.time()))
        row = cursor.fetchone()
        cursor.close()
    return json.loads(row[0]) if row else None


def mutate_session(session_id, update):
    """Apply a short state change under a write lock, preventing lost updates."""
    with connection() as conn:
        cursor = conn.cursor()
        if not is_postgres():
            cursor.execute("BEGIN IMMEDIATE")
        p = placeholder()
        suffix = " FOR UPDATE" if is_postgres() else ""
        cursor.execute(f"SELECT document FROM codepulse_sessions WHERE session_hash={p} AND expires_at>{p}{suffix}",
                       (session_hash(session_id), time.time()))
        row = cursor.fetchone()
        if row is None:
            raise KeyError("Session expired; reload the dashboard.")
        document = json.loads(row[0])
        update(document)
        cursor.execute(f"UPDATE codepulse_sessions SET document={p}, expires_at={p} WHERE session_hash={p}",
                       (json.dumps(document), time.time() + SESSION_SECONDS, session_hash(session_id)))
        cursor.close()
    return document


def delete_session(session_id):
    if not session_id:
        return
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM codepulse_sessions WHERE session_hash={placeholder()}", (session_hash(session_id),))
        cursor.close()


def live_sessions():
    """Used by the optional scheduler; only active connected sessions are returned."""
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"SELECT session_hash, document FROM codepulse_sessions WHERE expires_at>{placeholder()}", (time.time(),))
        rows = cursor.fetchall()
        cursor.close()
    return [(key, json.loads(value)) for key, value in rows if json.loads(value).get("mode") == "live"]


def update_snapshot_by_hash(key, snapshot):
    with connection() as conn:
        cursor = conn.cursor()
        p = placeholder()
        suffix = " FOR UPDATE" if is_postgres() else ""
        if not is_postgres():
            cursor.execute("BEGIN IMMEDIATE")
        cursor.execute(f"SELECT document FROM codepulse_sessions WHERE session_hash={p}{suffix}", (key,))
        row = cursor.fetchone()
        if row:
            document = json.loads(row[0])
            document["snapshot"] = snapshot
            cursor.execute(f"UPDATE codepulse_sessions SET document={p} WHERE session_hash={p}", (json.dumps(document), key))
        cursor.close()

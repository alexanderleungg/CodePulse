"""Optional durable-session sync worker: python -m backend.worker."""
import logging
import time

from backend import db
from backend.queue import dequeue_sync
from backend.security import decrypt_token
from poller.poller import GitHubClient

LOG = logging.getLogger(__name__)


def sync_workspace(session_hash, state=None):
    if state is None:
        state = next((document for key, document in db.live_sessions() if key == session_hash), None)
    if not state or not state.get("username"):
        return
    snapshot = GitHubClient(decrypt_token(state.get("token"))).sync(state["username"])
    db.update_snapshot_by_hash(session_hash, snapshot)


def main():
    logging.basicConfig(level=logging.INFO)
    db.ensure_schema()
    while True:
        try:
            key = dequeue_sync()
            if key:
                sync_workspace(key)
        except KeyboardInterrupt:
            break
        except Exception:
            # Do not include connection URLs, session documents, or tokens in logs.
            LOG.warning("Background sync failed; the next scheduled sync will retry.")
            time.sleep(5)


if __name__ == "__main__":
    main()

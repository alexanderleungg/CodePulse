"""Optional scheduler; all connected workspaces refresh every ten minutes.

With REDIS_URL, enqueue work for backend.worker; without Redis, sync inline.
Interactive local use only needs the API process and its Sync button.
"""
import argparse
import logging
import os

from apscheduler.schedulers.blocking import BlockingScheduler
from backend import db
from backend.queue import enqueue_sync
from backend.worker import sync_workspace

LOG = logging.getLogger(__name__)


def sync_all():
    for key, state in db.live_sessions():
        try:
            if os.getenv("REDIS_URL"):
                enqueue_sync(key)
            else:
                sync_workspace(key, state)
        except Exception:
            LOG.warning("A scheduled workspace sync failed; the next run will retry.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--once", action="store_true", help="Refresh connected sessions once and exit")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    db.ensure_schema()
    if args.once:
        sync_all()
        return
    scheduler = BlockingScheduler(timezone="UTC")
    scheduler.add_job(sync_all, "interval", minutes=10, max_instances=1, coalesce=True)
    LOG.info("CodePulse background scheduler started.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass


if __name__ == "__main__":
    main()

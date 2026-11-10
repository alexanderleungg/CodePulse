"""Optional Redis job queue. Interactive sync does not require Redis."""
import os

QUEUE_NAME = "codepulse:sync"


def client():
    url = os.getenv("REDIS_URL")
    if not url:
        raise RuntimeError("Set REDIS_URL to use the optional background queue.")
    import redis
    return redis.Redis.from_url(url, decode_responses=True, socket_timeout=10, socket_connect_timeout=5)


def enqueue_sync(session_hash):
    client().rpush(QUEUE_NAME, session_hash)


def dequeue_sync(timeout=5):
    item = client().blpop(QUEUE_NAME, timeout=timeout)
    return item[1] if item else None

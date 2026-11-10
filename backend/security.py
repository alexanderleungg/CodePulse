"""Server-side secrets and token encryption. Tokens never reach the browser."""
import base64
import hashlib
import os
import secrets
import tempfile
from functools import lru_cache
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken
from backend.db import data_dir


@lru_cache(maxsize=1)
def secret_key():
    configured = os.getenv("SECRET_KEY")
    if configured:
        if len(configured) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return configured
    path: Path = data_dir() / ".secret"
    if not path.exists():
        # Publish a complete key atomically: another API worker must never read
        # an empty file between creation and the first write.
        value = secrets.token_urlsafe(48)
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, prefix=".secret-", delete=False) as handle:
                temporary = Path(handle.name)
                handle.write(value)
                handle.flush()
                os.fsync(handle.fileno())
            try:
                os.link(temporary, path)
            except FileExistsError:
                pass  # Another process published its own complete key first.
        finally:
            if temporary:
                temporary.unlink(missing_ok=True)
    value = path.read_text().strip()
    if len(value) < 32:
        raise ValueError("The persistent data/.secret is invalid; restore its original value or set SECRET_KEY.")
    return value


def cipher():
    key = base64.urlsafe_b64encode(hashlib.sha256(secret_key().encode()).digest())
    return Fernet(key)


def encrypt_token(token):
    return cipher().encrypt(token.encode()).decode()


def decrypt_token(value):
    if not value:
        return None
    try:
        return cipher().decrypt(value.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("GitHub connection cannot be decrypted. Reconnect after changing SECRET_KEY.") from exc

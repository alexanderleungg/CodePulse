"""Persistent keys must survive restarts and keep OAuth tokens server-side."""
import os

import pytest

from backend.security import decrypt_token, encrypt_token, secret_key


@pytest.fixture(autouse=True)
def isolated_secret(tmp_path, monkeypatch):
    monkeypatch.setenv("CODEPULSE_DATA_DIR", str(tmp_path))
    monkeypatch.delenv("SECRET_KEY", raising=False)
    secret_key.cache_clear()
    yield tmp_path
    secret_key.cache_clear()


def test_generated_secret_is_persistent_and_private(isolated_secret):
    original = secret_key()
    secret_key.cache_clear()
    assert secret_key() == original
    path = isolated_secret / ".secret"
    assert len(path.read_text()) >= 32
    if os.name != "nt":
        assert path.stat().st_mode & 0o077 == 0
    assert not list(isolated_secret.glob(".secret-*"))
    encrypted = encrypt_token("github-private-token")
    assert "github-private-token" not in encrypted
    assert decrypt_token(encrypted) == "github-private-token"


def test_corrupt_persistent_secret_fails_before_tokens_are_reencrypted(isolated_secret):
    (isolated_secret / ".secret").write_text("")
    with pytest.raises(ValueError, match="persistent"):
        secret_key()


def test_changed_secret_does_not_silently_decrypt_old_tokens(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "first-configured-secret-with-at-least-thirty-two-characters")
    encrypted = encrypt_token("github-private-token")
    secret_key.cache_clear()
    monkeypatch.setenv("SECRET_KEY", "different-configured-secret-with-at-least-thirty-two-characters")
    with pytest.raises(ValueError, match="Reconnect"):
        decrypt_token(encrypted)

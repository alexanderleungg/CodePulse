"""Exercise the production entrypoint using the port assigned by a host."""
import http.client
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time

import pytest


def test_web_process_binds_environment_port(tmp_path):
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        port = reservation.getsockname()[1]
    env = dict(os.environ, PORT=str(port), CODEPULSE_DATA_DIR=str(tmp_path))
    env.pop("DATABASE_URL", None)
    env.pop("SECRET_KEY", None)
    process = subprocess.Popen(
        [sys.executable, "-m", "backend.server"],
        cwd=Path(__file__).resolve().parents[1], env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    try:
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            if process.poll() is not None:
                pytest.fail(f"Web process exited before becoming healthy: {process.stdout.read()}")
            connection = http.client.HTTPConnection("127.0.0.1", port, timeout=.5)
            try:
                connection.request("GET", "/api/health")
                response = connection.getresponse()
                assert response.status == 200
                assert json.loads(response.read())["application"] == "CodePulse"
                break
            except OSError:
                time.sleep(.05)
            finally:
                connection.close()
        else:
            pytest.fail("Web process did not bind the configured PORT within 10 seconds")
    finally:
        process.terminate()
        try:
            process.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.communicate()


def test_literal_port_placeholder_has_clear_error(monkeypatch):
    from backend.server import main
    monkeypatch.setenv("PORT", "$PORT")
    with pytest.raises(SystemExit, match="PORT must be an integer"):
        main()

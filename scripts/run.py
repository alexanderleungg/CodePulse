"""Start CodePulse's development API and dashboard with the active Python interpreter.

Run `python scripts/run.py` after installing the Python and npm dependencies.
No process is launched through a shell. Ctrl+C stops both child processes.
"""
from __future__ import annotations

import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if not npm:
        print("Node.js 22.12+ or 24 LTS and npm are required. Install Node, then run npm ci in dashboard/.")
        return 1
    if not (ROOT / "dashboard" / "node_modules").is_dir():
        print("Dashboard dependencies are missing. Run: cd dashboard && npm ci")
        return 1
    children: list[subprocess.Popen] = []
    flags = {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == "nt" else {"start_new_session": True}
    try:
        children.append(subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "backend.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
            cwd=ROOT, **flags,
        ))
        children.append(subprocess.Popen(
            [npm, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
            cwd=ROOT / "dashboard", **flags,
        ))
        print("\nCodePulse: http://localhost:5173\nAPI docs: http://localhost:8000/docs\nPress Ctrl+C to stop both services.\n", flush=True)
        while all(child.poll() is None for child in children):
            time.sleep(0.3)
        return next((child.returncode for child in children if child.returncode is not None), 1)
    except KeyboardInterrupt:
        return 0
    except OSError as exc:
        print(f"Unable to start CodePulse: {exc}", file=sys.stderr)
        return 1
    finally:
        for child in children:
            if child.poll() is None:
                if os.name == "nt":
                    child.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    os.killpg(child.pid, signal.SIGTERM)
        for child in children:
            try:
                child.wait(timeout=8)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()


if __name__ == "__main__":
    raise SystemExit(main())

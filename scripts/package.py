"""Package source and the current UI build, never secrets or runtime data.
Usage: python scripts/package.py /absolute/path/codepulse.zip
"""
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE_DIRS = {'.git', '.venv', 'venv', 'node_modules', '__pycache__', '.pytest_cache', 'data', '.cache'}
EXCLUDE_FILES = {'CONTRACT.md', '.coverage', '.secret', 'backup.sql'}

def package(destination):
    destination = Path(destination).resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(ROOT.rglob('*')):
            relative = path.relative_to(ROOT)
            if not path.is_file() or path.is_symlink() or path.resolve() == destination:
                continue
            if any(part in EXCLUDE_DIRS for part in relative.parts):
                continue
            if path.name in EXCLUDE_FILES or path.suffix in {'.pyc', '.log', '.db', '.sqlite', '.sqlite3'}:
                continue
            if path.name.startswith('.env') and not path.name.endswith('.example'):
                continue
            archive.write(path, Path('codepulse') / relative)
    return destination

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python scripts/package.py /absolute/path/codepulse.zip')
    print(package(sys.argv[1]))

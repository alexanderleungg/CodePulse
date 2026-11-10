"""
sanity checks for the study notes. run from the repo root:
    python dashboard/scripts/check_notes.py

checks every note in dashboard/src/notes/content:
  - no em dashes or en dashes (plain writing only)
  - every ```diagram block names a component exported from diagrams/<slug>.jsx
  - every ```python block is valid python syntax
  - every ```problems line has number | title | slug | difficulty
  - every note in catalog.js has a content file
"""
import re
import sys
from pathlib import Path

NOTES = Path(__file__).resolve().parent.parent / "src" / "notes"
FENCE = re.compile(r"```(\w+)([^\n]*)\n(.*?)```", re.S)

# snippets that are fragments of a bigger function (a loop body, a single line) can't compile alone.
# these are the only errors we forgive, anything else is a real mistake
FRAGMENT_ERRORS = ("outside loop", "outside function", "not properly in loop")


def check_note(md_path):
    slug = md_path.stem
    text = md_path.read_text()
    problems = []

    for bad in ("—", "–"):
        for n, line in enumerate(text.splitlines(), 1):
            if bad in line:
                problems.append(f"line {n}: dash character {bad!r}")

    diagrams_file = NOTES / "diagrams" / f"{slug}.jsx"
    exported = set()
    if diagrams_file.exists():
        exported = set(re.findall(r"export function (\w+)", diagrams_file.read_text()))

    for lang, meta, body in FENCE.findall(text):
        if lang == "diagram":
            name = body.strip()
            if name not in exported:
                problems.append(f"diagram '{name}' is not exported from diagrams/{slug}.jsx")
        elif lang == "python":
            try:
                compile(body, f"{slug}.md", "exec")
            except SyntaxError as e:
                if not any(msg in str(e) for msg in FRAGMENT_ERRORS):
                    problems.append(f"python syntax error in {meta.strip() or 'code block'}: {e}")
        elif lang == "problems":
            for line in body.strip().splitlines():
                parts = [p.strip() for p in line.split("|")]
                if len(parts) < 4 or not parts[0].isdigit() or parts[3] not in ("Easy", "Medium", "Hard"):
                    problems.append(f"bad practice line: {line}")
                elif not re.fullmatch(r"[a-z0-9-]+", parts[2]):
                    problems.append(f"bad slug: {parts[2]}")
    return problems


def main():
    catalog = (NOTES / "catalog.js").read_text()
    slugs = re.findall(r'slug: "([^"]+)"', catalog)
    failed = False
    for slug in slugs:
        md = NOTES / "content" / f"{slug}.md"
        if not md.exists():
            print(f"-  {slug}: not written yet")
            continue
        problems = check_note(md)
        if problems:
            failed = True
            print(f"x  {slug}")
            for p in problems:
                print(f"     {p}")
        else:
            print(f"ok {slug}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()

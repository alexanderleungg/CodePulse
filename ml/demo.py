"""Deterministic fictional data, generated relative to today for a useful preview."""
from datetime import datetime, timedelta, timezone
import random

from ml.topics import classify_repository


def demo_snapshot(now=None):
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    now = now.astimezone(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    rng = random.Random(42)
    descriptions = [
        ("orbit-ui", "A component library for calm, accessible interfaces.", {"TypeScript": 142000, "CSS": 36000}, ["react"], 46),
        ("portfolio-v3", "Personal portfolio with a tiny interactive playground.", {"TypeScript": 83000, "CSS": 21000}, ["next"], 12),
        ("habit-garden", "A habit tracker that grows with your routine.", {"TypeScript": 72000, "CSS": 26000}, ["react"], 28),
        ("recipe-book", "Collect recipes and find something good to cook.", {"JavaScript": 56000, "HTML": 18000, "CSS": 12000}, ["vue"], 8),
        ("tiny-api", "A small REST API for bookmarks with authentication.", {"Python": 61000}, ["fastapi"], 19),
        ("notes-service", "A backend service for searchable markdown notes.", {"TypeScript": 49000}, ["express"], 7),
        ("query-lab", "SQL experiments: query plans, indexes, and migrations.", {"SQL": 21000, "Python": 14000}, ["psycopg2"], 4),
        ("graph-playground", "Interactive graph algorithms and pathfinding visualizations.", {"TypeScript": 38000, "CSS": 8000}, ["react"], 31),
        ("algorithm-notes", "Small algorithms and data structures, with tests.", {"Python": 45000}, [], 14),
        ("tiny-shell", "A small C systems programming shell with pipes.", {"C": 32000}, [], 11),
        ("rust-cache", "An experimental cache for learning systems concurrency.", {"Rust": 47000}, [], 16),
        ("workspace-tools", "Development scripts for a more pleasant workspace.", {"Shell": 12000, "Python": 23000}, [], 3),
    ]
    repos = []
    for i, (name, desc, languages, dependencies, stars) in enumerate(descriptions):
        repo = {"id": i + 1, "name": name, "full_name": f"demo-developer/{name}", "description": desc,
                "html_url": "", "language": max(languages, key=languages.get), "languages": languages,
                "stars": stars, "updated_at": (today - timedelta(days=i * 2)).isoformat().replace("+00:00", "Z"),
                "fork": False, "archived": False, "dependencies": dependencies}
        repo["skills"] = classify_repository(repo, languages, dependencies)
        repos.append(repo)
    messages = {
        "frontend": ["Add keyboard navigation to command menu", "Refine responsive dashboard layout", "Extract reusable filter component", "Improve empty and loading states", "Add theme tokens and focus styles", "Fix mobile navigation overflow"],
        "backend": ["Validate API request payloads", "Add cursor pagination to endpoint", "Handle expired sessions gracefully", "Cover authentication edge cases", "Add request timeout handling"],
        "databases": ["Add migration for activity records", "Compare query plans with composite index", "Document transaction boundaries", "Add integration fixtures for SQL queries"],
        "algorithms": ["Implement breadth-first path search", "Add boundary cases for binary search", "Compare sorting strategies", "Explain graph traversal complexity"],
        "systems": ["Handle partial socket reads", "Add graceful thread shutdown", "Fix ownership around shared cache", "Document process lifecycle and signals"],
    }
    events = []
    for offset in range(179, -1, -1):
        day = today - timedelta(days=offset)
        # A few quiet days create a believable heatmap, not an unbroken streak.
        if rng.random() < (0.22 if day.weekday() < 5 else 0.48):
            continue
        amount = rng.randint(4, 15) if offset < 30 else rng.randint(1, 9)
        for n in range(amount):
            if offset < 30:
                pool = [0, 0, 0, 1, 1, 2, 3, 4, 5, 7]
            elif offset < 65:
                pool = [0, 1, 2, 3, 4, 5, 6, 7, 8]
            else:
                pool = list(range(12))
            repo = repos[rng.choice(pool)]
            stamp = day + timedelta(hours=9 + n % 12, minutes=rng.randrange(60))
            if stamp > now:
                stamp = now - timedelta(minutes=amount - n)
            skill = repo["skills"][0] if repo["skills"] else "backend"
            is_pr = n == 0 and rng.random() < 0.43
            title = rng.choice(messages[skill])
            events.append({"id": f"demo-{offset}-{n}", "type": "pull_request" if is_pr else "commit",
                           "title": ("Merge: " if is_pr else "") + title,
                           "repo": repo["full_name"], "url": "", "date": stamp.isoformat().replace("+00:00", "Z"),
                           "skills": repo["skills"]})
    # Deterministic snapshot dates track actual recent practice, including quiet repos.
    for repo in repos:
        stamps = [e["date"] for e in events if e["repo"] == repo["full_name"]]
        if stamps:
            repo["updated_at"] = max(stamps)
    return {"profile": {"login": "demo-developer", "name": "Alex Morgan", "avatar_url": "",
                        "html_url": "", "bio": "A fictional developer exploring the full stack. Build a little, learn a lot."},
            "repositories": repos, "events": events,
            "synced_at": now.isoformat().replace("+00:00", "Z"),
            "notices": ["Illustrative data from a fictional developer. Connect a GitHub username to analyze public activity.",
                        "Activity is evidence of practice, not a direct measure of proficiency."],
            "coverage": {"source": "fictional demo", "history_days": 180, "repositories_imported": len(repos),
                         "private_repositories": False, "complete": True}}

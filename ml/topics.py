"""Shared skill taxonomy and deliberately conservative repository heuristics.

A language is evidence of repository content, not evidence of proficiency or that
an individual authored every file. Skills can be corrected through manual practice.
"""
from collections.abc import Mapping
import re

SKILLS = [
    {"id": "frontend", "label": "Frontend", "color": "#80e7b4"},
    {"id": "backend", "label": "Backend", "color": "#b5a2f3"},
    {"id": "databases", "label": "Databases", "color": "#e7c783"},
    {"id": "algorithms", "label": "Algorithms", "color": "#87b9ed"},
    {"id": "systems", "label": "Systems", "color": "#f39d8d"},
]
SKILL_IDS = {s["id"] for s in SKILLS}
DEFAULT_TARGETS = {"frontend": 30, "backend": 25, "databases": 20, "algorithms": 15, "systems": 10}
DEFAULT_SETTINGS = {"targets": DEFAULT_TARGETS, "weekly_goal": 4}

# Retained for the original optional algorithm notebook and its diagrams.
INTERVIEW_TOPICS = [
    "Array", "Hash Table", "String", "Two Pointers", "Sliding Window", "Prefix Sum",
    "Sorting", "Matrix", "Stack", "Monotonic Stack", "Binary Search", "Linked List",
    "Tree", "Binary Tree", "Binary Search Tree", "Trie", "Heap (Priority Queue)",
    "Depth-First Search", "Breadth-First Search", "Graph Theory", "Topological Sort",
    "Union-Find", "Recursion", "Backtracking", "Dynamic Programming", "Greedy", "Bit Manipulation",
]


def _flatten_dependencies(dependencies):
    if isinstance(dependencies, Mapping):
        values = []
        for key, value in dependencies.items():
            values.append(str(key))
            if isinstance(value, Mapping):
                values.extend(_flatten_dependencies(value))
            elif isinstance(value, (list, tuple, set)):
                values.extend(str(v) for v in value)
        return values
    if isinstance(dependencies, str):
        return [dependencies]
    return [str(v) for v in (dependencies or [])]


def classify_repository(repo, languages=None, dependencies=None, paths=None):
    """Return heuristic skill IDs from languages, declared dependencies and paths.

    Python/JavaScript alone do not prove backend/frontend work. Metadata keywords
    and concrete dependency/file signals distinguish otherwise ambiguous stacks.
    """
    languages = languages if languages is not None else repo.get("languages", {})
    if isinstance(languages, Mapping):
        lang = {str(k).lower() for k, v in languages.items() if v}
    else:
        lang = {str(k).lower() for k in (languages or [])}
    if repo.get("language"):
        lang.add(str(repo["language"]).lower())
    deps = {d.lower() for d in _flatten_dependencies(dependencies or repo.get("dependencies"))}
    paths = [str(p).lower() for p in (paths or repo.get("paths") or [])]
    text = " ".join([str(repo.get("name", "")), str(repo.get("description") or ""),
                     " ".join(repo.get("topics") or [])]).lower()
    signals = set()
    frontend_deps = {"react", "react-dom", "vue", "svelte", "angular", "@angular/core", "next", "nuxt", "vite", "tailwindcss"}
    backend_deps = {"fastapi", "flask", "django", "express", "fastify", "koa", "hono", "spring", "@nestjs/core", "rails", "gin"}
    database_deps = {"psycopg2", "psycopg2-binary", "sqlalchemy", "prisma", "@prisma/client", "drizzle-orm", "mongoose", "sqlite3", "pg", "mysql2", "alembic", "redis"}
    if lang & {"html", "css", "scss", "sass", "vue", "svelte"} or deps & frontend_deps:
        signals.add("frontend")
    if deps & backend_deps or re.search(r"\b(api|backend|rest|graphql|microservice|server|fastapi|django|express)\b", text):
        signals.add("backend")
    if lang & {"sql", "plpgsql", "tsql"} or deps & database_deps or re.search(r"\b(database|postgres|postgresql|sqlite|mysql|sql|schema|migrations?)\b", text):
        signals.add("databases")
    if re.search(r"\b(algorithms?|leetcode|data.structures?|sorting|pathfinding|dynamic.programming|competitive.programming)\b", text):
        signals.add("algorithms")
    if lang & {"c", "c++", "rust", "assembly", "zig"} or re.search(r"\b(kernel|systems|concurrency|multithreaded|embedded|operating.system)\b", text):
        signals.add("systems")
    for path in paths:
        if path.endswith((".jsx", ".tsx", ".vue", ".svelte", ".css", ".scss")):
            signals.add("frontend")
        if path.endswith(".sql") or re.search(r"(^|/)(migrations|prisma|schemas)(/|$)", path):
            signals.add("databases")
        if re.search(r"(^|/)(routes|controllers|api|endpoints)(/|$)", path):
            signals.add("backend")
        if re.search(r"(^|/)(algorithms|data-structures|leetcode)(/|$)", path):
            signals.add("algorithms")
    return [s["id"] for s in SKILLS if s["id"] in signals]

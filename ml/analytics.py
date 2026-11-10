"""Pure analytics for snapshots: no database, network, tokens, or proficiency claims."""
from collections import Counter, defaultdict
from copy import deepcopy
from datetime import datetime, timedelta, timezone

from ml.goal import get_weekly_goal
from ml.recommender import get_recommendations
from ml.topics import SKILLS, SKILL_IDS, DEFAULT_SETTINGS

LANGUAGE_COLORS = {"TypeScript": "#87b9ed", "JavaScript": "#e7c783", "Python": "#b5a2f3",
                   "C++": "#f39d8d", "C": "#f39d8d", "Rust": "#e9ad88", "HTML": "#ef9e8c",
                   "CSS": "#80e7b4", "SQL": "#e7c783", "Go": "#7dc5d7", "Shell": "#9bb6ab"}


def _stamp(value):
    if not isinstance(value, str):
        return None
    try:
        stamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if stamp.tzinfo is None:
            stamp = stamp.replace(tzinfo=timezone.utc)
        return stamp.astimezone(timezone.utc)
    except ValueError:
        return None


def _normalize_events(events, now):
    seen = set()
    result = []
    for item in events:
        if not isinstance(item, dict):
            continue
        stamp = _stamp(item.get("date"))
        if stamp is None or stamp > now:
            continue
        # A commit may be imported through multiple pages or several syncs. Repo
        # identity keeps identically named events from different repos separate.
        key = (item.get("type"), str(item.get("id")), item.get("repo"))
        if item.get("id") is None:
            key = (item.get("type"), item.get("url"), item.get("repo"), item.get("date"), item.get("title"))
        if key in seen:
            continue
        seen.add(key)
        event = deepcopy(item)
        event["date"] = stamp.isoformat().replace("+00:00", "Z")
        event["skills"] = list(dict.fromkeys(s for s in (item.get("skills") or []) if s in SKILL_IDS))
        event["_stamp"] = stamp
        result.append(event)
    return sorted(result, key=lambda e: (e["date"], str(e.get("id"))), reverse=True)


def _weighted_counts(events):
    counts = Counter()
    for event in events:
        skills = event["skills"]
        if skills:
            for skill in skills:
                counts[skill] += 1 / len(skills)
    return counts


def _share(count, total):
    return round(count / total * 100, 1) if total else 0.0


def build_dashboard(snapshot, settings=None, projects=None, days=30, mode="live", now=None):
    """Convert one bounded GitHub snapshot into all dashboard views.

    Windows contain `days` UTC calendar dates, ending now. Manual entries count as
    practice but never commits or PRs. Multi-skill events are split equally so
    practice shares have a meaningful 100% total. Unclassified work stays visible.
    """
    if days not in (30, 90, 180):
        raise ValueError("Window must be 30, 90, or 180 days")
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    now = now.astimezone(timezone.utc)
    settings = deepcopy(settings or DEFAULT_SETTINGS)
    settings.setdefault("targets", deepcopy(DEFAULT_SETTINGS["targets"]))
    settings.setdefault("weekly_goal", DEFAULT_SETTINGS["weekly_goal"])
    snapshot = deepcopy(snapshot or {})
    events = _normalize_events(snapshot.get("events", []), now)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start = today - timedelta(days=days - 1)
    previous_start = start - timedelta(days=days)
    current = [e for e in events if e["_stamp"] >= start]
    previous = [e for e in events if previous_start <= e["_stamp"] < start]
    weights = _weighted_counts(current)
    prior_weights = _weighted_counts(previous)
    classified_total = sum(weights.values())
    prior_total = sum(prior_weights.values())
    skills = []
    for definition in SKILLS:
        sid = definition["id"]
        evidence_events = [e for e in events if sid in e["skills"]]
        recent_events = [e for e in current if sid in e["skills"]]
        recent_manual = sum(e.get("type") == "manual" for e in recent_events)
        last = evidence_events[0]["date"] if evidence_events else None
        last_stamp = _stamp(last)
        share = _share(weights[sid], classified_total)
        inferred = len(recent_events) - recent_manual
        evidence = []
        if inferred:
            evidence.append(f"{inferred} GitHub activity records inherit repository-level skill tags; changed files were not individually assessed.")
        if recent_manual:
            evidence.append(f"{recent_manual} practice entries were tagged by you.")
        if not evidence:
            evidence.append("No practice evidence in this window. Missing activity does not establish a skill gap.")
        skills.append({**definition, "count": round(weights[sid], 2), "share": share,
                       "target": settings["targets"].get(sid, 0), "last_practiced": last,
                       "days_since": (now.date() - last_stamp.date()).days if last_stamp else None,
                       "trend": round(share - _share(prior_weights[sid], prior_total), 1),
                       "confidence": "self-reported" if recent_manual and not inferred else "heuristic" if inferred else "no evidence",
                       "evidence": evidence})

    daily = {}
    for offset in range(days):
        day = (start + timedelta(days=offset)).date().isoformat()
        daily[day] = {"day": day, "count": 0, "commits": 0, "pull_requests": 0, "manual": 0}
    for event in current:
        day = daily[event["_stamp"].date().isoformat()]
        day["count"] += 1
        if event.get("type") == "commit":
            day["commits"] += 1
        elif event.get("type") == "pull_request":
            day["pull_requests"] += 1
        elif event.get("type") == "manual":
            day["manual"] += 1
    weekly = {}
    for day in daily.values():
        date = datetime.fromisoformat(day["day"]).date()
        monday = (date - timedelta(days=date.weekday())).isoformat()
        week = weekly.setdefault(monday, {"week": monday, "commits": 0, "pull_requests": 0, "manual": 0, "count": 0})
        for key in ("commits", "pull_requests", "manual", "count"):
            week[key] += day[key]

    repo_counts = defaultdict(Counter)
    for event in current:
        repo_counts[event.get("repo")][event.get("type")] += 1
    repositories = []
    seen_repos = set()
    language_bytes = Counter()
    for repo in snapshot.get("repositories", []):
        identity = repo.get("full_name") or str(repo.get("id")) or repo.get("name")
        if identity in seen_repos:
            continue
        seen_repos.add(identity)
        counts = repo_counts[repo.get("full_name") or repo.get("name")]
        repo["commits"] = counts["commit"]
        repo["pull_requests"] = counts["pull_request"]
        repo.setdefault("skills", [])
        repo.setdefault("languages", {})
        for language, size in repo["languages"].items():
            if isinstance(size, (int, float)) and size > 0:
                language_bytes[language] += size
        repositories.append(repo)
    repositories.sort(key=lambda r: (-r["commits"] - r["pull_requests"], r.get("name", "")))
    total_bytes = sum(language_bytes.values())
    languages = [{"name": name, "bytes": size, "share": _share(size, total_bytes),
                  "color": LANGUAGE_COLORS.get(name, "#9caaa5")}
                 for name, size in language_bytes.most_common()]
    feed = [{k: v for k, v in e.items() if k != "_stamp"} for e in current[:100]]
    coverage = deepcopy(snapshot.get("coverage") or {})
    coverage.update({"classified_events": sum(bool(e["skills"]) for e in current),
                     "unclassified_events": sum(not e["skills"] for e in current),
                     "classification_method": "Repository metadata, language inventory, dependencies and file paths when available; not changed-file or proficiency analysis.",
                     "language_basis": "Bytes in imported repository snapshots, not time spent or bytes authored in the selected window.",
                     "window_start": start.isoformat().replace("+00:00", "Z"),
                     "window_end": now.isoformat().replace("+00:00", "Z"),
                     "timezone": "UTC"})
    return {"mode": mode, "profile": snapshot.get("profile") or {"login": "", "name": "Developer", "avatar_url": "", "html_url": "", "bio": ""},
            "synced_at": snapshot.get("synced_at"), "window_days": days,
            "summary": {"commits": sum(e.get("type") == "commit" for e in current),
                        "repositories": len(repositories), "active_days": sum(d["count"] > 0 for d in daily.values()),
                        "pull_requests": sum(e.get("type") == "pull_request" for e in current)},
            "activity": list(daily.values()), "weekly": list(weekly.values()), "skills": skills,
            "languages": languages, "repositories": repositories, "feed": feed,
            "goal": get_weekly_goal(events, settings["weekly_goal"], now),
            "recommendations": get_recommendations(skills), "settings": settings,
            "projects": deepcopy(projects or []), "notices": snapshot.get("notices", []), "coverage": coverage}

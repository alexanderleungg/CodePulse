"""Pure analytics contract tests; no network or database required."""
from datetime import datetime, timedelta, timezone
import unittest

from ml.analytics import build_dashboard
from ml.catalog import PROJECTS
from ml.demo import demo_snapshot
from ml.goal import get_weekly_goal
from ml.recommender import get_recommendations, priority_score
from ml.topics import SKILLS, classify_repository

NOW = datetime(2026, 11, 10, 18, tzinfo=timezone.utc)


def event(identifier, date, skills=None, type="commit", repo="a/repo"):
    return {"id": identifier, "type": type, "title": "Example practice", "repo": repo,
            "url": "", "date": date, "skills": skills or []}


class ClassificationTests(unittest.TestCase):
    def test_ambiguous_language_does_not_invent_backend(self):
        self.assertEqual(classify_repository({"name": "scripts"}, {"Python": 1000}), [])
        self.assertEqual(classify_repository({"name": "utility"}, {"TypeScript": 1000}), [])

    def test_dependencies_distinguish_frontend_backend_and_database(self):
        self.assertEqual(classify_repository({"name": "service"}, {"TypeScript": 100},
                         {"dependencies": {"express": "*", "pg": "*"}}), ["backend", "databases"])
        self.assertEqual(classify_repository({"name": "site"}, {"TypeScript": 100}, ["react"]), ["frontend"])

    def test_paths_metadata_and_system_languages(self):
        ids = classify_repository({"name": "algorithm-playground", "description": "Graph algorithms"},
                                  {"C++": 100}, paths=["src/Graph.tsx", "migrations/001.sql"])
        self.assertEqual(ids, ["frontend", "databases", "algorithms", "systems"])


class AnalyticsTests(unittest.TestCase):
    def dashboard(self, events, **kwargs):
        return build_dashboard({"events": events, "repositories": []}, now=NOW, **kwargs)

    def test_empty_history_is_valid_and_has_goal_recommendations(self):
        data = self.dashboard([])
        self.assertEqual(data["summary"], {"commits": 0, "pull_requests": 0, "active_days": 0, "repositories": 0})
        self.assertEqual(len(data["activity"]), 30)
        self.assertEqual(len(data["skills"]), 5)
        self.assertTrue(all(s["days_since"] is None for s in data["skills"]))
        self.assertTrue(data["recommendations"])

    def test_calendar_window_boundary_timezone_and_future(self):
        data = self.dashboard([
            event("inside", "2026-10-12T00:00:00Z", ["frontend"]),
            event("outside", "2026-10-11T23:59:59Z", ["backend"]),
            event("offset", "2026-10-11T20:00:00-04:00", ["frontend"]),
            event("future", "2026-11-10T18:00:01Z", ["systems"]),
            event("invalid", "not-a-date", ["systems"]),
        ])
        self.assertEqual(data["summary"]["commits"], 2)
        self.assertEqual(data["summary"]["active_days"], 1)
        self.assertEqual(data["activity"][0]["count"], 2)
        self.assertEqual(next(s for s in data["skills"] if s["id"] == "systems")["days_since"], None)

    def test_duplicate_imports_and_fractional_attribution(self):
        shared = event("sha1", "2026-11-09T12:00:00Z", ["frontend", "backend", "frontend"])
        data = self.dashboard([shared, shared, event("sha2", "2026-11-09T13:00:00Z", ["unknown"])])
        skills = {s["id"]: s for s in data["skills"]}
        self.assertEqual(data["summary"]["commits"], 2)
        self.assertEqual(skills["frontend"]["count"], 0.5)
        self.assertEqual(skills["frontend"]["share"], 50)
        self.assertEqual(skills["backend"]["share"], 50)
        self.assertEqual(data["coverage"]["unclassified_events"], 1)

    def test_manual_practice_is_not_commit_and_goal_uses_distinct_days(self):
        data = self.dashboard([
            event("sha", "2026-11-09T12:00:00Z", ["frontend"]),
            event("manual", "2026-11-09T14:00:00Z", ["systems"], type="manual"),
            event("pr", "2026-11-10T14:00:00Z", ["backend"], type="pull_request"),
        ])
        self.assertEqual(data["summary"]["commits"], 1)
        self.assertEqual(data["summary"]["pull_requests"], 1)
        self.assertEqual(data["goal"]["completed"], 2)
        systems = next(s for s in data["skills"] if s["id"] == "systems")
        self.assertEqual(systems["confidence"], "self-reported")

    def test_recency_uses_all_imported_history_and_trend_uses_previous_window(self):
        data = self.dashboard([
            event("old", "2026-10-01T12:00:00Z", ["systems"]),
            event("new", "2026-11-09T12:00:00Z", ["frontend"]),
        ])
        skills = {s["id"]: s for s in data["skills"]}
        self.assertEqual(skills["systems"]["share"], 0)
        self.assertEqual(skills["systems"]["days_since"], 40)
        self.assertEqual(skills["systems"]["trend"], -100)
        self.assertEqual(skills["frontend"]["trend"], 100)

    def test_language_inventory_is_not_activity_measure(self):
        snapshot = {"events": [], "repositories": [{"id": 1, "name": "one", "full_name": "a/one", "languages": {"Python": 60, "SQL": 40}}]}
        data = build_dashboard(snapshot, now=NOW)
        self.assertEqual(data["languages"][0]["share"], 60)
        self.assertIn("not time spent", data["coverage"]["language_basis"])

    def test_input_data_never_mutated(self):
        snapshot = demo_snapshot(NOW)
        old_count = len(snapshot["events"])
        data = build_dashboard(snapshot, now=NOW)
        self.assertEqual(len(snapshot["events"]), old_count)
        self.assertNotIn("_stamp", snapshot["events"][0])
        self.assertNotIn("commits", snapshot["repositories"][0])
        self.assertEqual(len(data["repositories"]), 12)
        self.assertEqual(demo_snapshot(NOW), snapshot)
        self.assertEqual(data["mode"], "live")

    def test_all_supported_windows_and_reject_bad_window(self):
        for days in (30, 90, 180):
            self.assertEqual(len(self.dashboard([], days=days)["activity"]), days)
        with self.assertRaises(ValueError):
            self.dashboard([], days=5)


class RecommendationTests(unittest.TestCase):
    def skills(self):
        return [{**s, "target": 20, "share": 20, "days_since": 5, "last_practiced": "2026-11-05T12:00:00Z"} for s in SKILLS]

    def test_catalog_covers_every_skill_and_difficulty_with_rerolls(self):
        self.assertEqual(len({p["id"] for p in PROJECTS}), len(PROJECTS))
        for skill in SKILLS:
            for difficulty in ("beginner", "intermediate", "advanced"):
                self.assertGreaterEqual(len([p for p in PROJECTS if p["skill_id"] == skill["id"] and p["difficulty"] == difficulty]), 3)
        self.assertTrue(all(len(p["milestones"]) >= 3 and p["resources"] for p in PROJECTS))

    def test_difficulty_filter_exclusion_and_input_immutability(self):
        skills = self.skills()
        first = get_recommendations(skills, "beginner")
        reroll = get_recommendations(skills, "beginner", [p["id"] for p in first])
        self.assertTrue(all(p["difficulty"] == "beginner" for p in reroll))
        self.assertFalse({p["id"] for p in first} & {p["id"] for p in reroll})
        first[0]["milestones"].append("Do not mutate catalog")
        self.assertTrue(all("Do not mutate catalog" not in p["milestones"] for p in PROJECTS))

    def test_goal_gap_and_recency_affect_priority(self):
        skills = self.skills()
        systems = next(s for s in skills if s["id"] == "systems")
        systems.update({"target": 50, "share": 0, "days_since": 90})
        ranked = get_recommendations(skills)
        self.assertEqual(ranked[0]["skill_id"], "systems")
        systems["target"] = 0
        self.assertNotIn("systems", {p["skill_id"] for p in get_recommendations(skills)})
        self.assertEqual(priority_score(systems), 0)

    def test_invalid_difficulty_is_explicit(self):
        with self.assertRaises(ValueError):
            get_recommendations(self.skills(), "expert")


if __name__ == "__main__":
    unittest.main()

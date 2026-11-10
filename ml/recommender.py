"""Transparent, goal-aware project recommendations without an external AI service."""
from copy import deepcopy
import math

from ml.catalog import PROJECTS

DIFFICULTIES = {"beginner", "intermediate", "advanced"}


def priority_score(skill):
    """importance × practice gap × freshness; counts never claim proficiency."""
    target = max(0, float(skill.get("target", 0)))
    if target == 0:
        return 0.0
    share = max(0, float(skill.get("share", 0)))
    gap = max(0, target - share) / target
    stale_days = 180 if skill.get("days_since") is None else max(0, skill["days_since"])
    freshness = 1 + math.log1p(min(180, stale_days)) / math.log1p(180)
    return round((target / 100) * (0.2 + gap) * freshness, 4)


def get_project(project_id):
    return next((deepcopy(p) for p in PROJECTS if p["id"] == project_id), None)


def get_recommendations(skills, difficulty="intermediate", exclude=None):
    """Return one actionable brief per target skill, ranked by practice priority.

    Excluding the displayed IDs gives a deterministic reroll with no surprise AI
    output. At least three briefs exist per skill and difficulty.
    """
    if difficulty not in DIFFICULTIES:
        raise ValueError("Difficulty must be beginner, intermediate, or advanced")
    if isinstance(exclude, str):
        exclude = exclude.split(",")
    excluded = set(exclude or [])
    ranked = sorted((s for s in skills if s.get("target", 0) > 0),
                    key=lambda s: (-priority_score(s), s["id"]))
    result = []
    for skill in ranked:
        project = next((p for p in PROJECTS if p["skill_id"] == skill["id"]
                        and p["difficulty"] == difficulty and p["id"] not in excluded), None)
        if not project:
            continue
        project = deepcopy(project)
        share = skill.get("share", 0)
        target = skill.get("target", 0)
        gap = max(0, target - share)
        if skill.get("last_practiced") is None:
            freshness = "No practice evidence was found in the imported history."
        else:
            freshness = f"Last practice evidence was {skill.get('days_since', 0)} days ago."
        if gap:
            comparison = f"{skill['label']} accounts for {share:g}% of classified activity against your {target:g}% target."
        else:
            comparison = f"{skill['label']} meets your {target:g}% practice target; a small project can help keep it fresh."
        project.update({"score": priority_score(skill), "reason": f"{comparison} {freshness}",
                        "score_breakdown": {"goal_importance": target / 100,
                                            "practice_gap": round(gap, 2),
                                            "days_since": skill.get("days_since")}})
        result.append(project)
    return result

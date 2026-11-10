"""Practice freshness helpers; a quiet skill is not a declining skill."""


def get_review_queue(skills, limit=5):
    """Return goal-relevant skills with no recent evidence of practice."""
    relevant = [s for s in skills if s.get("target", 0) > 0 and
                (s.get("days_since") is None or s["days_since"] >= 30)]
    return sorted(relevant, key=lambda s: (s.get("days_since") is None,
                  s.get("days_since") or 0, s.get("target", 0)), reverse=True)[:limit]

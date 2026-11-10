"""A user-controlled goal in distinct practice days, never commit volume."""
from datetime import datetime, timedelta, timezone


def get_weekly_goal(events, target=4, now=None):
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    now = now.astimezone(timezone.utc)
    today = now.date()
    monday = today - timedelta(days=today.weekday())
    active = set()
    for event in events:
        try:
            stamp = datetime.fromisoformat(event["date"].replace("Z", "+00:00"))
            if stamp.tzinfo is None:
                stamp = stamp.replace(tzinfo=timezone.utc)
            stamp = stamp.astimezone(timezone.utc)
            if stamp <= now:
                active.add(stamp.date())
        except (ValueError, TypeError, KeyError):
            continue
    days = []
    for i in range(7):
        day = monday + timedelta(days=i)
        days.append({"day": day.isoformat(), "label": day.strftime("%a")[0],
                     "active": day in active, "today": day == today})
    return {"target": max(1, min(7, int(target))),
            "completed": sum(d["active"] for d in days), "days": days,
            "basis": "Distinct days with a commit, pull request, or manual practice entry. Weeks use UTC."}

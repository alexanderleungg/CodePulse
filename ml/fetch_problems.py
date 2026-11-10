"""Inspect the curated project catalog (retained CLI path from LC Tracker).

Run `python -m ml.fetch_problems` to see available CodePulse project briefs.
The catalog ships with the source; no LeetCode credentials or seeding is needed.
"""
import json
from ml.catalog import PROJECTS

if __name__ == "__main__":
    print(json.dumps(PROJECTS, indent=2))

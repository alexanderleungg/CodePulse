"""Export a CodePulse demo snapshot for development (no external API required)."""
import json
from ml.demo import demo_snapshot

if __name__ == "__main__":
    print(json.dumps(demo_snapshot(), indent=2))

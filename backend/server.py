"""Start the web service without relying on shell expansion of Railway's PORT."""
import os

import uvicorn


def main():
    try:
        port = int(os.getenv("PORT", "8000"))
        if not 1 <= port <= 65535:
            raise ValueError
    except ValueError:
        raise SystemExit("PORT must be an integer between 1 and 65535.") from None
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()

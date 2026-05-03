from __future__ import annotations

import argparse
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"


def default_host() -> str:
    return os.environ.get("HOST") or ("0.0.0.0" if os.environ.get("RENDER") else "127.0.0.1")


def default_port() -> int:
    return int(os.environ.get("PORT") or ("10000" if os.environ.get("RENDER") else "8000"))


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the CFA Level 2 sprint app.")
    parser.add_argument("--host", default=default_host(), help="Use 0.0.0.0 for home Wi-Fi access.")
    parser.add_argument("--port", default=default_port(), type=int)
    args = parser.parse_args()

    if not STATIC_DIR.exists():
        raise SystemExit(f"Missing static directory: {STATIC_DIR}")

    server = ThreadingHTTPServer((args.host, args.port), AppHandler)
    print(f"CFA sprint app running at http://{args.host}:{args.port}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

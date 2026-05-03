from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the CFA Level 2 sprint app.")
    parser.add_argument("--host", default="127.0.0.1", help="Use 0.0.0.0 for home Wi-Fi access.")
    parser.add_argument("--port", default=8000, type=int)
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

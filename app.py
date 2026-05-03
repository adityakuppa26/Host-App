from __future__ import annotations

import argparse
import json
import os
import sqlite3
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import RLock
from urllib.parse import urlparse


APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"
DEFAULT_DATA_DIR = Path("/var/data") if os.environ.get("RENDER") else APP_DIR / "data"
DATA_DIR = Path(os.environ.get("DATA_DIR") or DEFAULT_DATA_DIR)
PROGRESS_DB = DATA_DIR / "progress.sqlite3"
LEGACY_PROGRESS_FILE = DATA_DIR / "progress.json"
PROGRESS_ID = "shared"
MAX_PROGRESS_BYTES = 128 * 1024
DB_LOCK = RLock()


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(PROGRESS_DB, timeout=10)
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA busy_timeout=5000")
    return connection


def init_db() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    with connect_db() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS progress (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        if LEGACY_PROGRESS_FILE.exists() and read_progress_db(connection) == {}:
            with LEGACY_PROGRESS_FILE.open("r", encoding="utf-8") as handle:
                legacy_payload = json.load(handle)
            if isinstance(legacy_payload, dict):
                write_progress_db(connection, legacy_payload)


def read_progress_db(connection: sqlite3.Connection | None = None) -> dict:
    owns_connection = connection is None
    if owns_connection:
        connection = connect_db()
    assert connection is not None
    try:
        row = connection.execute("SELECT payload FROM progress WHERE id = ?", (PROGRESS_ID,)).fetchone()
        if not row:
            return {}
        payload = json.loads(row[0])
        return payload if isinstance(payload, dict) else {}
    finally:
        if owns_connection:
            connection.close()


def write_progress_db(connection: sqlite3.Connection, payload: dict) -> None:
    connection.execute(
        """
        INSERT INTO progress (id, payload, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            payload = excluded.payload,
            updated_at = excluded.updated_at
        """,
        (
            PROGRESS_ID,
            json.dumps(payload, separators=(",", ":"), sort_keys=True),
            datetime.now(timezone.utc).isoformat(),
        ),
    )


def merge_lists(left: object, right: object) -> list:
    left_items = left if isinstance(left, list) else []
    right_items = right if isinstance(right, list) else []
    return sorted({item for item in [*left_items, *right_items] if isinstance(item, str)})


def merge_progress(existing: dict, incoming: dict) -> dict:
    merged = {**existing, **incoming}

    existing_best = existing.get("bestPercent", 0)
    incoming_best = incoming.get("bestPercent", 0)
    if existing_best > incoming_best:
        merged["bestPercent"] = existing_best
        merged["bestPoints"] = existing.get("bestPoints", 0)
    elif existing_best == incoming_best:
        merged["bestPoints"] = max(existing.get("bestPoints", 0), incoming.get("bestPoints", 0))

    merged["bestStreak"] = max(existing.get("bestStreak", 0), incoming.get("bestStreak", 0))
    merged["clearedBosses"] = merge_lists(existing.get("clearedBosses"), incoming.get("clearedBosses"))
    merged["seenQuestions"] = merge_lists(existing.get("seenQuestions"), incoming.get("seenQuestions"))

    existing_date = existing.get("dailyDate", "")
    incoming_date = incoming.get("dailyDate", "")
    if existing_date > incoming_date:
        merged["dailyDate"] = existing_date
        merged["dailyStreak"] = existing.get("dailyStreak", 0)
        merged["dailyRuns"] = existing.get("dailyRuns", 0)
    elif existing_date == incoming_date:
        merged["dailyStreak"] = max(existing.get("dailyStreak", 0), incoming.get("dailyStreak", 0))
        merged["dailyRuns"] = max(existing.get("dailyRuns", 0), incoming.get("dailyRuns", 0))

    return merged


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

    def do_GET(self):
        if self.route_path() == "/api/progress":
            self.send_progress()
            return
        super().do_GET()

    def do_PUT(self):
        if self.route_path() == "/api/progress":
            self.save_progress()
            return
        self.send_error(404, "Not found")

    def do_POST(self):
        self.do_PUT()

    def route_path(self) -> str:
        return urlparse(self.path).path

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_progress(self) -> None:
        try:
            payload = read_progress_db()
        except (OSError, sqlite3.Error, json.JSONDecodeError):
            self.send_error(500, "Could not read progress")
            return
        self.send_json(200, payload)

    def save_progress(self) -> None:
        try:
            length = int(self.headers.get("Content-Length") or "0")
        except ValueError:
            self.send_error(400, "Invalid content length")
            return
        if length <= 0 or length > MAX_PROGRESS_BYTES:
            self.send_error(400, "Invalid progress payload")
            return

        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_error(400, "Invalid JSON")
            return
        if not isinstance(payload, dict):
            self.send_error(400, "Progress payload must be an object")
            return

        try:
            with DB_LOCK, connect_db() as connection:
                connection.execute("BEGIN IMMEDIATE")
                payload = merge_progress(read_progress_db(connection), payload)
                write_progress_db(connection, payload)
        except (OSError, sqlite3.Error, json.JSONDecodeError):
            self.send_error(500, "Could not save progress")
            return
        self.send_json(200, {"ok": True})


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the CFA Level 2 sprint app.")
    parser.add_argument("--host", default=default_host(), help="Use 0.0.0.0 for home Wi-Fi access.")
    parser.add_argument("--port", default=default_port(), type=int)
    args = parser.parse_args()

    if not STATIC_DIR.exists():
        raise SystemExit(f"Missing static directory: {STATIC_DIR}")
    init_db()

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

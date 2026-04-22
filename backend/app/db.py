"""SQLite connection helper.

The database file path is configurable via the ``BOP_DB_PATH`` environment
variable. By default it points to ``backend/data/app.db``.
"""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

_DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "app.db"
DB_PATH = Path(os.environ.get("BOP_DB_PATH", str(_DEFAULT_DB)))


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Yield a SQLite connection with row access by column name."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

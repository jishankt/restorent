"""
full_reset.py
=============
Deletes ALL data from ALL tables in restaurant.db.
Only keeps:
  - doctypes          (populated by migrate_doctypes.py)
  - address_structures (populated by migrate_address_labels.py)

After running this, re-run:
  python migrate_doctypes.py
  python migrate_address_labels.py
"""

import sqlite3
import json
import os
import subprocess
import sys

DB_PATH = "restaurant.db"

# Tables whose data should be KEPT (migration tables only)
KEEP_TABLES = {"doctypes", "address_structures"}


def get_all_tables(cur):
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    return [row[0] for row in cur.fetchall()]


def full_reset():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.execute("PRAGMA journal_mode=WAL")
    cur = conn.cursor()

    tables = get_all_tables(cur)
    print(f"Found {len(tables)} tables: {tables}\n")

    cleared = []
    kept = []
    failed = []

    for table in tables:
        if table in KEEP_TABLES:
            count = cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            kept.append((table, count))
            print(f"[KEEP]   {table:<35} -> {count} rows preserved")
            continue

        try:
            before = cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            cur.execute(f"DELETE FROM {table}")
            after = cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            cleared.append((table, before))
            print(f"[CLEAR]  {table:<35} -> deleted {before} rows (remaining: {after})")
        except Exception as e:
            failed.append((table, str(e)))
            print(f"[ERROR]  {table:<35} -> {e}")

    conn.commit()
    conn.close()

    print("\n" + "="*60)
    print(f"RESET COMPLETE")
    print(f"  Tables cleared : {len(cleared)}")
    print(f"  Tables kept    : {len(kept)} -> {[t for t, _ in kept]}")
    print(f"  Tables failed  : {len(failed)}")
    if failed:
        for t, err in failed:
            print(f"    - {t}: {err}")
    print("="*60)
    print("\nNow running migrations...\n")

    # Re-run migrations immediately
    r1 = subprocess.run([sys.executable, "migrate_doctypes.py"], capture_output=True, text=True)
    print("--- migrate_doctypes.py ---")
    print(r1.stdout)
    if r1.stderr:
        print("STDERR:", r1.stderr)

    r2 = subprocess.run([sys.executable, "migrate_address_labels.py"], capture_output=True, text=True)
    print("--- migrate_address_labels.py ---")
    print(r2.stdout)
    if r2.stderr:
        print("STDERR:", r2.stderr)

    print("\nAll done! Database is clean. Only migration data remains.")


if __name__ == "__main__":
    print("="*60)
    print(" FULL DATABASE RESET")
    print(" Keeps: doctypes, address_structures only")
    print("="*60 + "\n")
    full_reset()

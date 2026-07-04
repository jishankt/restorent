import sqlite3
import json

conn = sqlite3.connect('restaurant.db')
cur = conn.cursor()

cur.execute("SELECT id, data FROM users")
rows = cur.fetchall()
deleted = 0

for row_id, row_data in rows:
    try:
        d = json.loads(row_data)
        val = str(d).lower()
        if 'companyone' in val:
            cur.execute("DELETE FROM users WHERE id = ?", (row_id,))
            print(f"Deleted user: {d.get('email')} / {d.get('username')} / role: {d.get('role')}")
            deleted += 1
    except Exception as e:
        print(f"Error parsing row {row_id}: {e}")

conn.commit()
print(f"\nTotal deleted: {deleted}")
remaining = cur.execute("SELECT COUNT(*) FROM users").fetchone()[0]
print(f"Users remaining in table: {remaining}")
conn.close()

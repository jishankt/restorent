import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- Items Distribution ---")
    rows = cur.execute("SELECT data FROM items").fetchall()
    dist = {}
    for row in rows:
        data = json.loads(row[0])
        comp = data.get('company_name') or data.get('company') or "Unknown"
        branch = data.get('branch_name') or data.get('branch') or "None"
        key = f"{comp} | {branch}"
        dist[key] = dist.get(key, 0) + 1
    print(json.dumps(dist, indent=2))
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

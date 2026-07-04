import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- Deep Inspect User kyle1@gmail.com ---")
    rows = cur.execute("SELECT data FROM users").fetchall()
    for row in rows:
        data = json.loads(row[0])
        if data.get('email') == 'kyle1@gmail.com':
            print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

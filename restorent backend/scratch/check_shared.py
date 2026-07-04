import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- Shared Items Check ---")
    rows = cur.execute("SELECT data FROM items").fetchall()
    shared = 0
    for row in rows:
        data = json.loads(row[0])
        comps = data.get('company_names', [])
        if len(comps) > 1:
            shared += 1
            if shared < 5:
                print(f"Shared Item: {data.get('item_name')} | Comps: {comps}")
    print(f"Total Shared Items: {shared}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

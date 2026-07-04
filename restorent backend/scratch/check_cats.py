import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- KyleSolution Items Category Check ---")
    rows = cur.execute("SELECT data FROM items").fetchall()
    cats = {}
    for row in rows:
        data = json.loads(row[0])
        comp = data.get('company_name') or data.get('company')
        if comp == 'KyleSolution':
            cat = data.get('item_group') or "Uncategorized"
            cats[cat] = cats.get(cat, 0) + 1
    print(json.dumps(cats, indent=2))
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

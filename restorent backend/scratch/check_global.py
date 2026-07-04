import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- Checking for 'All' items ---")
    rows = cur.execute("SELECT data FROM items").fetchall()
    found = 0
    for row in rows:
        data = json.loads(row[0])
        comp = data.get('company_name') or data.get('company')
        if comp in ['all', 'All', 'ALL', 'Global', 'global', None, '']:
            found += 1
            if found < 5:
                 print(f"Global Item: {data.get('name')} | Comp: {comp} | Branch: {data.get('branch_name')}")
    print(f"Total Global Items: {found}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- KyleSolution Items Detailed Check ---")
    rows = cur.execute("SELECT data FROM items").fetchall()
    found = 0
    for row in rows:
        data = json.loads(row[0])
        comp = data.get('company_name') or data.get('company')
        comps = data.get('company_names', [])
        
        if comp == 'KyleSolution' or 'KyleSolution' in comps:
            found += 1
            if found < 5:
                print(f"Item: {data.get('item_name')} | Comp: {comp} | Comps: {comps} | Branch: {data.get('branch_name')}")
    print(f"Total Items for KyleSolution: {found}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

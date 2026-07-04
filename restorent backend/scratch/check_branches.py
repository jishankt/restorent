import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- KyleSolution Items Branch Check ---")
    rows = cur.execute("SELECT data FROM items").fetchall()
    branches = {}
    for row in rows:
        data = json.loads(row[0])
        comp = data.get('company_name') or data.get('company')
        if comp == 'KyleSolution':
            branch = data.get('branch_name') or data.get('branch')
            branches[str(branch)] = branches.get(str(branch), 0) + 1
    print(json.dumps(branches, indent=2))
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- KyleSolution Company Level Settings ---")
    rows = cur.execute("SELECT data FROM workflow_visibility").fetchall()
    for row in rows:
        data = json.loads(row[0])
        company = data.get('company_name')
        branch = data.get('branch_name')
        if company == 'KyleSolution' and (branch is None or branch == ''):
            print(f"Data: {json.dumps(data, indent=2)}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

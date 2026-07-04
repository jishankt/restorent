import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- Items Count for KyleSolution ---")
    rows = cur.execute("SELECT data FROM items").fetchall()
    counts = {"total": 0, "KyleSolution": 0, "KyleSolution_Kyle1": 0, "KyleSolution_All": 0}
    for row in rows:
        data = json.loads(row[0])
        counts["total"] += 1
        comp = data.get('company_name') or data.get('company')
        branch = data.get('branch_name') or data.get('branch')
        if comp == 'KyleSolution':
            counts["KyleSolution"] += 1
            if branch == 'Kyle1':
                counts["KyleSolution_Kyle1"] += 1
            elif branch in ['all', 'All', None, '']:
                counts["KyleSolution_All"] += 1
    print(json.dumps(counts, indent=2))
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

import sqlite3
import json
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'restaurant.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, data FROM workflow_visibility")
for row in c:
    d = json.loads(row[1])
    print(f"Company: {d.get('company_name')}, Branch: {d.get('branch_name')}")
    print(json.dumps(d.get('settings'), indent=2))

conn.close()

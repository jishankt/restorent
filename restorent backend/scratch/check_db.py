import sqlite3
import json

db_path = r'restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("SELECT id, data FROM doctypes")
rows = cur.fetchall()

for row_id, row_data in rows:
    data = json.loads(row_data)
    if data.get('name') == "Address Structure":
        print(f"ID: {row_id}")
        print(f"Company Names: {data.get('company_names')}")
        print("Fields:")
        for f in data.get('fields', []):
            print(f" - {f.get('label')} ({f.get('id')})")

conn.close()

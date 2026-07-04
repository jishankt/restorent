import sqlite3
import json

db_path = 'restaurant.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT id, data FROM doctypes")
rows = cursor.fetchall()
for row_id, data_str in rows:
    data = json.loads(data_str)
    if data.get('name') == 'Customer':
        print(f"Row ID: {row_id}")
        print(f"  company_names: {data.get('company_names')}")
        print(f"  fields:")
        for f in data.get('fields', []):
            print(f"    - id: {f.get('id')}, label: {f.get('label')}, type: {f.get('type')}")
        print("-" * 50)
conn.close()

import sqlite3
import json
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'restaurant.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT id, data FROM plan_configs")
for row in c:
    plan_id = row[0]
    data = json.loads(row[1])
    print(f"Plan Name: {data.get('plan_name')}")
    print("  Items:")
    for item in data.get('items', []):
        print(f"    - {item.get('name')} (ID: {item.get('id')})")
        if item.get('pages'):
            for page in item.get('pages'):
                print(f"      * {page.get('name')} (ID: {page.get('id')})")
conn.close()

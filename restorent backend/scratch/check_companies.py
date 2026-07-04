import sqlite3
import json
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'restaurant.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("--- company_details ---")
c.execute("SELECT id, data FROM company_details")
for row in c:
    d = json.loads(row[1])
    print(f"ID: {row[0]}, Name: {d.get('company_name') or d.get('restaurantName')}, Tenant ID: {d.get('tenant_id')}")

print("\n--- companies ---")
c.execute("SELECT id, data FROM companies")
for row in c:
    d = json.loads(row[1])
    print(f"ID: {row[0]}, Name: {d.get('company_name')}, Tenant ID: {d.get('tenant_id')}")

conn.close()

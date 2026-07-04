import sqlite3
import json
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'restaurant.db')
print("Connecting to:", db_path)
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT id, data FROM tenants")
for row in c:
    tenant_id = row[0]
    data = json.loads(row[1])
    print(f"Tenant ID: {tenant_id}")
    print(f"  Name: {data.get('tenant_name')}")
    print(f"  Subscription Plan: {data.get('subscription_plan')}")
    print(f"  Plan Features (Count): {len(data.get('plan_features', [])) if data.get('plan_features') else 'None'}")
    if data.get('plan_features'):
        print("  Items:")
        for item in data.get('plan_features'):
            print(f"    - {item.get('name')} (ID: {item.get('id')})")
            if item.get('pages'):
                for page in item.get('pages'):
                    print(f"      * {page.get('name')} (ID: {page.get('id')})")
conn.close()

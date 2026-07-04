import sqlite3
import json
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'restaurant.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Find tenant 'kyle'
c.execute("SELECT id, data FROM tenants")
kyle_id = None
kyle_data = None
for row in c:
    d = json.loads(row[1])
    if d.get('tenant_name') == 'kyle':
        kyle_id = row[0]
        kyle_data = d
        break

if kyle_id and kyle_data:
    print("Found tenant 'kyle'. Current plan_features count:", len(kyle_data.get('plan_features', [])))
    # Filter out Customer Management (mod_customer_mgmt) from plan_features
    orig_features = kyle_data.get('plan_features', [])
    new_features = [f for f in orig_features if f.get('id') != 'mod_customer_mgmt']
    kyle_data['plan_features'] = new_features
    print("New plan_features count (after removing mod_customer_mgmt):", len(new_features))
    
    # Save back to database
    json_doc = json.dumps(kyle_data)
    c.execute("UPDATE tenants SET data = ? WHERE id = ?", (json_doc, kyle_id))
    conn.commit()
    print("Updated tenant 'kyle' in database.")
else:
    print("Tenant 'kyle' not found.")

conn.close()

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
    print("Found tenant 'kyle'.")
    orig_features = kyle_data.get('plan_features', [])
    new_features = []
    for item in orig_features:
        # Clone item
        item_copy = item.copy()
        if 'pages' in item_copy:
            # Filter out page_posd_bal (POS Balance)
            item_copy['pages'] = [p for p in item_copy['pages'] if p.get('id') != 'page_posd_bal']
        new_features.append(item_copy)
    
    kyle_data['plan_features'] = new_features
    # Save back to database
    json_doc = json.dumps(kyle_data)
    c.execute("UPDATE tenants SET data = ? WHERE id = ?", (json_doc, kyle_id))
    conn.commit()
    print("Removed page_posd_bal (POS Balance) from kyle's snapshot in database.")
else:
    print("Tenant 'kyle' not found.")

conn.close()

import sqlite3
import json
import uuid

db_path = 'restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# 1. Load the current 'Employee Department' with 'manoj'
cur.execute("SELECT id, data FROM doctypes WHERE data LIKE '%Employee Department%' AND data LIKE '%manoj%'")
row = cur.fetchone()

if row:
    row_id, data_str = row
    data = json.loads(data_str)
    
    # Create a copy for the Group (company)
    group_data = data.copy()
    group_data['company_names'] = ["company"]
    group_data['company_name'] = "company"
    group_data['company'] = "company"
    group_data['_id'] = str(uuid.uuid4())
    
    cur.execute("INSERT INTO doctypes (id, data) VALUES (?, ?)", (group_data['_id'], json.dumps(group_data)))
    print(f"Created group-specific version for 'company' with ID: {group_data['_id']}")
    
    # 2. Restore the original 'All' version (remove 'manoj' field)
    all_data = data.copy()
    all_data['fields'] = [f for f in all_data['fields'] if f['id'] != 'manoj']
    all_data['company_names'] = ["All"]
    all_data['company_name'] = "All"
    all_data['company'] = "All"
    all_data['_id'] = row_id # Keep the same ID for the global record
    
    cur.execute("UPDATE doctypes SET data = ? WHERE id = ?", (json.dumps(all_data), row_id))
    print(f"Restored global 'All' version for ID: {row_id}")
    
else:
    print("Could not find Employee Department with 'manoj' field.")

conn.commit()
conn.close()

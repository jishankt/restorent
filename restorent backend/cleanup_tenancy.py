import sqlite3
import json
import re

db_path = r'c:\manoj\webrestaurant\backend\restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

def fix_tenancy(data_json):
    data = json.loads(data_json)
    
    # 1. Fix company strings (remove 'All' prefix if merged)
    for field in ['company', 'company_name']:
        val = data.get(field)
        if isinstance(val, str):
            if val.startswith('All') and len(val) > 3:
                data[field] = val[3:]
    
    # 2. Fix company lists
    for field in ['companies', 'company_names']:
        vals = data.get(field, [])
        if isinstance(vals, list):
            new_vals = []
            for v in vals:
                if isinstance(v, str):
                    if v.startswith('All') and len(v) > 3:
                        new_vals.append(v[3:])
                    else:
                        new_vals.append(v)
            # Remove 'All' if specific company exists
            specific = [v for v in new_vals if v.lower() != 'all']
            if specific:
                data[field] = list(set(specific))
            else:
                data[field] = new_vals
                
    # 3. Final singular field check
    if isinstance(data.get('company_names'), list) and data['company_names']:
        data['company'] = data['company_names'][0]
        data['company_name'] = data['company_names'][0]

    return json.dumps(data)

# Fix workers
cur.execute("SELECT id, data FROM new_employee")
for row_id, data_str in cur.fetchall():
    new_data = fix_tenancy(data_str)
    cur.execute("UPDATE new_employee SET data = ? WHERE id = ?", (new_data, row_id))

# Fix users
cur.execute("SELECT id, data FROM users")
for row_id, data_str in cur.fetchall():
    new_data = fix_tenancy(data_str)
    cur.execute("UPDATE users SET data = ? WHERE id = ?", (new_data, row_id))

conn.commit()
conn.close()
print("Tenancy data cleanup completed.")

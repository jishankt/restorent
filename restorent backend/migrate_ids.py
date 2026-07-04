import sqlite3
import json
import re

db_path = r'c:\manoj\webrestaurant\backend\restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

def get_prefix(company_name):
    if not company_name or str(company_name).lower() == 'all':
        return 'EMP'
    comp_str = str(company_name).lower()
    if 'companyone' in comp_str: return 'CO'
    if 'companytwo' in comp_str: return 'CT'
    if 'companythree' in comp_str: return 'C3'
    clean_name = "".join(filter(str.isalnum, str(company_name))).upper()
    return clean_name[:2] if len(clean_name) >= 2 else clean_name.ljust(2, 'X')

# Track max IDs for each prefix to avoid collisions during rename
# But wait, we can just use the existing sequence number if it exists
def fix_record(data_json):
    data = json.loads(data_json)
    
    # Normalize company names
    for field in ['company', 'company_name']:
        val = data.get(field)
        if isinstance(val, str) and val.startswith('All') and len(val) > 3:
            data[field] = val[3:]
            
    # Fix ID
    old_id = data.get('employeeId', '')
    prefix = get_prefix(data.get('company'))
    
    # If ID starts with COM or EMP, migrate it
    if old_id.startswith('COM') or old_id.startswith('EMP'):
        match = re.search(r'(\d+)$', old_id)
        if match:
            num = match.group(1)
            data['employeeId'] = f"{prefix}{num.zfill(4)}"
            print(f"Renamed {old_id} -> {data['employeeId']} for {data.get('company')}")

    return json.dumps(data)

# Fix workers
cur.execute("SELECT id, data FROM new_employee")
for row_id, data_str in cur.fetchall():
    new_data = fix_record(data_str)
    cur.execute("UPDATE new_employee SET data = ? WHERE id = ?", (new_data, row_id))

# Fix users
cur.execute("SELECT id, data FROM users")
for row_id, data_str in cur.fetchall():
    new_data = fix_record(data_str)
    cur.execute("UPDATE users SET data = ? WHERE id = ?", (new_data, row_id))

conn.commit()
conn.close()
print("ID Migration and Tenancy cleanup completed.")

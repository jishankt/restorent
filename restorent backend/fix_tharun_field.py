import sqlite3
import json
import os

db_path = 'restaurant.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Update SQLite Database
cursor.execute("SELECT id, data FROM doctypes")
rows = cursor.fetchall()

customer_updated = False
address_updated = False
tharun_field_obj = {
    "allow_create_new": False,
    "hidden": False,
    "id": "tharun",
    "is_default": False,
    "label": "tharun",
    "link_doctype": "",
    "mandatory": False,
    "type": "Data"
}

for row_id, data_str in rows:
    try:
        data = json.loads(data_str)
    except Exception as e:
        print(f"Error parsing row {row_id}: {e}")
        continue
        
    name = data.get('name')
    company_names = data.get('company_names', [])
    
    if name == 'Customer' and "All" in company_names:
        fields = data.get('fields', [])
        # Find if tharun is in fields
        tharun_fields = [f for f in fields if f.get('id') == 'tharun']
        if tharun_fields:
            tharun_field_obj = tharun_fields[0] # capture actual object if exists
            new_fields = [f for f in fields if f.get('id') != 'tharun']
            data['fields'] = new_fields
            updated_data_str = json.dumps(data)
            cursor.execute("UPDATE doctypes SET data = ? WHERE id = ?", (updated_data_str, row_id))
            print(f"Removed 'tharun' field from Global Customer doctype in DB.")
            customer_updated = True
            
    if name == 'Address Structure' and "All" in company_names:
        fields = data.get('fields', [])
        # Check if already exists
        if not any(f.get('id') == 'tharun' for f in fields):
            fields.append(tharun_field_obj)
            data['fields'] = fields
            updated_data_str = json.dumps(data)
            cursor.execute("UPDATE doctypes SET data = ? WHERE id = ?", (updated_data_str, row_id))
            print(f"Added 'tharun' field to Global Address Structure doctype in DB.")
            address_updated = True

conn.commit()
conn.close()

# 2. Update JSON files
global_customer_path = os.path.join('doctypes', 'Global_customer.json')
global_address_path = os.path.join('doctypes', 'Global_address_structure.json')

if os.path.exists(global_customer_path):
    with open(global_customer_path, 'r', encoding='utf-8') as f:
        cust_data = json.load(f)
    fields = cust_data.get('fields', [])
    new_fields = [f for f in fields if f.get('id') != 'tharun']
    cust_data['fields'] = new_fields
    with open(global_customer_path, 'w', encoding='utf-8') as f:
        json.dump(cust_data, f, indent=2)
    print("Removed 'tharun' field from Global_customer.json")

if os.path.exists(global_address_path):
    with open(global_address_path, 'r', encoding='utf-8') as f:
        addr_data = json.load(f)
    fields = addr_data.get('fields', [])
    if not any(f.get('id') == 'tharun' for f in fields):
        fields.append(tharun_field_obj)
        addr_data['fields'] = fields
        with open(global_address_path, 'w', encoding='utf-8') as f:
            json.dump(addr_data, f, indent=2)
        print("Added 'tharun' field to Global_address_structure.json")

print("Fix completed.")

import sqlite3
import json

db_path = 'restaurant.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Fetch all records since name is inside the data JSON
cursor.execute("SELECT id, data FROM doctypes")
rows = cursor.fetchall()

for row_id, data_str in rows:
    try:
        data = json.loads(data_str)
    except:
        continue
        
    name = data.get('name')
    company_names = data.get('company_names', [])
    
    if name == 'Customer' and "All" in company_names:
        print(f"Cleaning up Global Customer DocType (ID: {row_id})...")
        fields = data.get('fields', [])
        
        # Keep only core fields
        core_field_ids = ['customer_name', 'phone_number', 'email', 'customer_group', 'whatsapp_number', 'address']
        new_fields = [f for f in fields if f['id'] in core_field_ids or f.get('is_default', False)]
        
        data['fields'] = new_fields
        updated_data_str = json.dumps(data)
        
        cursor.execute("UPDATE doctypes SET data = ? WHERE id = ?", (updated_data_str, row_id))
        print(f"Removed experimental fields. New field count: {len(new_fields)}")

conn.commit()
conn.close()
print("Cleanup complete.")

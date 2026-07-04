import sqlite3
import json

db_path = 'restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("SELECT id, data FROM purchase_items")
rows = cur.fetchall()
updated_count = 0

for row in rows:
    item_id, data_str = row
    try:
        item = json.loads(data_str)
    except json.JSONDecodeError:
        continue

    update_data = {}
    
    if 'company' in item:
        update_data['brand'] = item['company']
        
    if 'name' in item:
        update_data['item_name'] = item['name']
        
    if 'boxToMaster' in item:
        update_data['packets_per_box'] = float(item['boxToMaster'])
        
    if 'masterToOuter' in item:
        update_data['units_per_packet'] = float(item['masterToOuter'])
        
    if 'outerToNos' in item:
        update_data['total_units_per_box'] = float(item['outerToNos'])

    if update_data:
        # Apply updates
        item.update(update_data)
        
        # Remove old keys
        for key in ['company', 'name', 'boxToMaster', 'masterUnit', 'masterToOuter', 'outerUnit', 'outerToNos', 'nosUnit']:
            if key in item:
                del item[key]
                
        # Save back
        cur.execute("UPDATE purchase_items SET data = ? WHERE id = ?", (json.dumps(item), item_id))
        updated_count += 1

conn.commit()
conn.close()
print(f"SQLite Migration completed. Updated {updated_count} purchase items.")

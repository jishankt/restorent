import sqlite3
import json
import uuid

conn = sqlite3.connect('restaurant.db')
cursor = conn.cursor()

targets = ['Purchase Item', 'Supplier', 'Purchase Order', 'Purchase Receipt', 'Purchase Invoice', 'Purchase Report']

try:
    print('Deleting existing configurations...')
    cursor.execute('SELECT id, data FROM doctypes')
    rows = cursor.fetchall()
    deleted_ids = []
    for row_id, data_str in rows:
        data = json.loads(data_str)
        if data.get('name') in targets:
            deleted_ids.append(row_id)
            print(f'Deleting {data.get("name")} (id: {row_id})')
    
    if deleted_ids:
        placeholders = ','.join(['?']*len(deleted_ids))
        cursor.execute(f'DELETE FROM doctypes WHERE id IN ({placeholders})', deleted_ids)
        print(f'Deleted {len(deleted_ids)} old records.')

    print('Inserting fresh configurations...')
    for t in targets:
        row_id = uuid.uuid4().hex
        data = json.dumps({'name': t, 'fields': []})
        cursor.execute('INSERT INTO doctypes (id, data) VALUES (?, ?)', (row_id, data))
        print(f'Inserted {t}')

    conn.commit()
    print('Successfully migrated purchase doctypes.')
except Exception as e:
    print('Error:', e)
finally:
    conn.close()

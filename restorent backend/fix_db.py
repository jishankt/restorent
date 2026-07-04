import sqlite3
import json

conn = sqlite3.connect('restaurant.db')
cur = conn.cursor()

for table in ['customers', 'items']:
    cur.execute(f'SELECT id, data FROM {table}')
    rows = cur.fetchall()
    
    for row_id, data_str in rows:
        data = json.loads(data_str)
        if data.get('branch_name') == 'All Branches':
            branch_names = data.get('branch_names', [])
            if isinstance(branch_names, list) and set(branch_names) != {'All Branches'}:
                data['branch_names'] = ['All Branches']
                data['branch'] = 'All Branches'
                new_data_str = json.dumps(data)
                cur.execute(f'UPDATE {table} SET data = ? WHERE id = ?', (new_data_str, row_id))
                print(f'Fixed ghost branch in {table} row {row_id}')

conn.commit()
conn.close()
print('Database ghost branches cleaned up.')

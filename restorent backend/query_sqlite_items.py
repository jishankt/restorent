import sqlite3, json
conn = sqlite3.connect('restaurant_pos.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute('SELECT * FROM items')
rows = cur.fetchall()
print(f'Total items: {len(rows)}')
for row in rows:
    data = json.loads(row['data'])
    print(f"Name: {data.get('item_name')}, Group: {data.get('item_group')}, Hidden: {data.get('is_hidden')}, Company: {data.get('company_name')}, Branch: {data.get('branch_name')}")

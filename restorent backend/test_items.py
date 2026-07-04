import sqlite3, json
conn = sqlite3.connect(r'c:\manoj\backend\restaurant.db')
cursor = conn.cursor()
cursor.execute('SELECT data FROM items')
rows = cursor.fetchall()
print(f'Total items in DB: {len(rows)}')
for row in rows:
    d = json.loads(row[0])
    print(f"{d.get('item_name')} | C: {d.get('company_names')} | B: {d.get('branch_names')}")

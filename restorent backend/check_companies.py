import sqlite3, json
conn = sqlite3.connect('restaurant.db')
cur = conn.cursor()
cur.execute("SELECT data FROM companies WHERE json_extract(data, '$.tenant_id') = '3de83211-87dc-4c1d-85be-e9cc321b14f4'")
res = cur.fetchall()
print(f"Found {len(res)} companies.")
for r in res:
    print(json.loads(r[0])['company_name'])

import sqlite3
import json
conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
c.execute("SELECT data FROM documents WHERE collection_name='worker_collection' LIMIT 5")
rows = c.fetchall()
for r in rows:
    data = json.loads(r[0])
    print(f"Name: {data.get('name')}, Email: {data.get('email')}, Company: {data.get('company')}, Companies: {data.get('companies')}, CompanyNames: {data.get('company_names')}")

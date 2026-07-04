import sqlite3
import json

conn = sqlite3.connect('restaurant.db')
cursor = conn.cursor()

cursor.execute("SELECT id, data FROM sales")
rows = cursor.fetchall()
print("Total sales rows:", len(rows))
for r in rows:
    data = json.loads(r[1])
    inv = data.get('invoice_no', '')
    if inv in ['KY-AL-TAK-0001', 'KY-KY-TAK-0001']:
        print(f"ID: {r[0]}, invoice: {inv}, branch_name: {data.get('branch_name')}, branch: {data.get('branch')}, company: {data.get('company_name')}")

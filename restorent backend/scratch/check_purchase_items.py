import sqlite3
import json

conn = sqlite3.connect('restaurant.db')
cursor = conn.cursor()

cursor.execute("SELECT data FROM purchase_items")
rows = cursor.fetchall()

kyle_items = []
cola_items = []
all_items = []

for row in rows:
    data = json.loads(row[0])
    all_items.append(data)
    company = data.get('company') or data.get('company_name')
    if company == 'KyleSolution':
        kyle_items.append(data)
    elif company == 'cola':
        cola_items.append(data)

print(f"Total items in DB: {len(all_items)}")
print(f"Items with company 'KyleSolution': {len(kyle_items)}")
print(f"Items with company 'cola': {len(cola_items)}")

if kyle_items:
    print("\nSample KyleSolution Item:")
    print(json.dumps(kyle_items[0], indent=2))
else:
    # Check if KyleSolution is listed as a supplier in any item
    supplier_items = []
    for data in all_items:
        suppliers = data.get('suppliers', [])
        if any(s.get('supplierName') == 'KyleSolution' for s in suppliers):
            supplier_items.append(data)
    print(f"Items where 'KyleSolution' is a supplier: {len(supplier_items)}")
    if supplier_items:
        print("\nSample Item where KyleSolution is supplier:")
        print(json.dumps(supplier_items[0], indent=2))

conn.close()

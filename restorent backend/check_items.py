import sqlite3, json
from app1 import SQLiteCollection
conn = sqlite3.connect('restaurant.db')
items_col = SQLiteCollection(conn, 'items')
items = items_col.find({})
print(f"Total items: {len(items)}")
for item in items[:20]:
    print(f"Item: {item.get('item_name')}, Company: {item.get('company_name')}, Branch: {item.get('branch_name')}")

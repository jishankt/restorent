import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- Detailed Items Dump ---")
    rows = cur.execute("SELECT data FROM items").fetchall()
    for i, row in enumerate(rows):
        data = json.loads(row[0])
        print(f"Item #{i+1}:")
        print(f"  Name: {data.get('item_name')}")
        print(f"  Code: {data.get('item_code')}")
        print(f"  Companies: {data.get('company_names')}")
        print(f"  Branches: {data.get('branch_names')}")
        print(f"  Branch Prices: {data.get('branch_prices')}")
        print(f"  Company Prices: {data.get('company_prices')}")
        print("-" * 40)
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

import sqlite3
import json

conn = sqlite3.connect('restaurant.db')
cur = conn.cursor()

# Fetch Kitchens
rows = cur.execute("SELECT id, data FROM kitchens").fetchall()
print("=== KITCHENS ===")
for r_id, r_json in rows:
    doc = json.loads(r_json)
    print(f"ID: {r_id} -> Name: {doc.get('kitchen_name')}, Company: {doc.get('company_name') or doc.get('company')}, Branch: {doc.get('branch_name') or doc.get('branch')}, target_companies: {doc.get('target_companies')}, target_branches: {doc.get('target_branches')}")

# Fetch Item Groups
rows = cur.execute("SELECT id, data FROM item_groups").fetchall()
print("\n=== ITEM GROUPS ===")
for r_id, r_json in rows:
    doc = json.loads(r_json)
    print(f"ID: {r_id} -> Name: {doc.get('group_name')}, Company: {doc.get('company_name') or doc.get('company')}, Branch: {doc.get('branch_name') or doc.get('branch')}, target_companies: {doc.get('target_companies')}, target_branches: {doc.get('target_branches')}")

conn.close()


import sqlite3
import json
import os

db_path = r'c:\manoj\webrestaurant\backend\restaurant.db'

def inspect_table(table_name):
    print(f"\n--- {table_name} ---")
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    try:
        rows = cur.execute(f"SELECT data FROM {table_name} LIMIT 50").fetchall()
        print(f"Total rows found: {len(rows)}")
        for i, row in enumerate(rows):
            data = json.loads(row[0])
            print(f"Row {i+1}: ID={data.get('_id')}, Company={data.get('company')}, CompanyName={data.get('company_name')}, CreatedBy={data.get('created_by')}")
            if table_name == 'suppliers':
                print(f"  TargetCos: {data.get('target_companies')}, TargetBranches: {data.get('target_branches')}")
            elif table_name == 'supplier_groups':
                print(f"  GroupName: {data.get('group_name')}, Branches: {data.get('branch_names')}")
    except Exception as e:
        print(f"Error inspecting {table_name}: {e}")
    finally:
        conn.close()

inspect_table('suppliers')
inspect_table('supplier_groups')
inspect_table('users')

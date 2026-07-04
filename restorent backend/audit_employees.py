import sqlite3
import json
import os

db_path = r'c:\manoj\webrestaurant\backend\restaurant.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute('SELECT data FROM new_employee')
    rows = cursor.fetchall()
    print(f"Total employees: {len(rows)}")
    print("EMP_ID | NAME | COMPANY | COMPANY_NAME | COMPANY_NAMES | COMPANIES")
    print("-" * 100)
    for row in rows:
        r = json.loads(row[0])
        emp_id = r.get('employeeId', r.get('employee_id', 'N/A'))
        name = r.get('name', 'N/A')
        comp = r.get('company', 'N/A')
        comp_name = r.get('company_name', 'N/A')
        comp_names = r.get('company_names', 'MISSING')
        comps = r.get('companies', 'N/A')
        print(f"{emp_id} | {name} | {comp} | {comp_name} | {comp_names} | {comps}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

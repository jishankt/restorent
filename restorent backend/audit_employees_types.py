import sqlite3
import json
import os

db_path = r'c:\manoj\webrestaurant\backend\restaurant.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute('SELECT data FROM new_employee')
    rows = cursor.fetchall()
    print("EMP_ID | NAME | COMPANY_NAME_VAL | TYPE")
    print("-" * 50)
    for row in rows:
        r = json.loads(row[0])
        emp_id = r.get('employeeId', r.get('employee_id', 'N/A'))
        name = r.get('name', 'N/A')
        comp_name = r.get('company_name', 'N/A')
        print(f"{emp_id} | {name} | {comp_name} | {type(comp_name)}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

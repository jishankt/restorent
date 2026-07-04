import sqlite3
import json

def check_arjun():
    conn = sqlite3.connect('restaurant.db')
    cur = conn.cursor()
    
    email = 'arjun@gmail.com'
    print(f"--- Checking records for {email} ---")
    
    tables = ['new_employee', 'users']
    for table in tables:
        rows = cur.execute(f"SELECT id, data FROM {table}").fetchall()
        for rid, rdata in rows:
            d = json.loads(rdata)
            if d.get('email') == email:
                print(f"\nTable: {table} | ID: {rid}")
                print(f"  employeeId: {d.get('employeeId')}")
                print(f"  company: {d.get('company')}")
                print(f"  company_names: {d.get('company_names')}")
                print(f"  branch: {d.get('branch')}")
                print(f"  branch_names: {d.get('branch_names')}")
    
    conn.close()

if __name__ == '__main__':
    check_arjun()

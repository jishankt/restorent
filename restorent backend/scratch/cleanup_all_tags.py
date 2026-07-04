import sqlite3
import json
import os

DB_PATH = r'c:\manoj\webrestaurant\backend\restaurant.db'

def cleanup():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("Checking for employees tagged with 'All' but belonging to CO0001 (companyone)...")
    
    rows = cursor.execute("SELECT id, data FROM new_employee").fetchall()
    updated_count = 0

    for row in rows:
        row_id = row['id']
        try:
            data = json.loads(row['data'])
        except:
            continue

        emp_id = data.get('employeeId', '')
        company = data.get('company', '')
        companies = data.get('companies', [])

        # Logic for companyone
        is_co1 = emp_id.startswith('CO0001')
        
        # If it's a CO1 employee but company is 'All' or is list containing 'All'
        needs_update = False
        if is_co1:
            if company == 'All' or 'All' in companies:
                needs_update = True
        
        if needs_update:
            print(f"Updating Employee {data.get('name')} ({emp_id})...")
            # Set to specific company
            data['company'] = 'companyone'
            data['companies'] = ['companyone']
            data['company_name'] = ['companyone']
            
            # Use JSON dumps without indentation for compact storage
            new_data_str = json.dumps(data)
            cursor.execute("UPDATE new_employee SET data = ? WHERE id = ?", (new_data_str, row_id))
            
            # Also sync users collection if needed
            email = data.get('email')
            if email:
                user_rows = cursor.execute("SELECT id, data FROM users WHERE data LIKE ?", (f'%{email}%',)).fetchall()
                for ur in user_rows:
                    try:
                        u_data = json.loads(ur['data'])
                        if u_data.get('email') == email:
                            u_data['company'] = 'companyone'
                            u_data['companies'] = ['companyone']
                            # Sync back
                            cursor.execute("UPDATE users SET data = ? WHERE id = ?", (json.dumps(u_data), ur['id']))
                    except:
                        pass
            
            updated_count += 1

    conn.commit()
    conn.close()
    print(f"Successfully updated {updated_count} records.")

if __name__ == "__main__":
    cleanup()

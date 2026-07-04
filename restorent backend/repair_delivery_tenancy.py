import sqlite3
import json
import os

def repair_employees():
    db_path = 'restaurant.db'
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Load all general employees into a map for fast lookup
    print("Loading general employees...")
    cur.execute("SELECT data FROM new_employee")
    rows = cur.fetchall()
    general_map = {}
    for row in rows:
        try:
            data = json.loads(row[0])
            if '_id' in data:
                general_map[data['_id']] = data
        except:
            continue

    # 2. Iterate through delivery profiles (employees table)
    print("Repairing delivery profiles (employees table)...")
    cur.execute("SELECT id, data FROM employees")
    delivery_rows = cur.fetchall()
    
    updated_count = 0
    for row_id, row_data in delivery_rows:
        try:
            data = json.loads(row_data)
            gen_id = data.get('generalEmployeeId')
            
            if gen_id in general_map:
                gen_emp = general_map[gen_id]
                target_company = gen_emp.get('company') or gen_emp.get('company_name')
                
                if target_company and (data.get('company') != target_company or data.get('company_name') != target_company):
                    data['company'] = target_company
                    data['company_name'] = target_company
                    
                    # Update record
                    cur.execute("UPDATE employees SET data = ? WHERE id = ?", (json.dumps(data), row_id))
                    updated_count += 1
                    print(f"Repaired profile {row_id} (linked to {gen_id}): Set company to {target_company}")
        except Exception as e:
            print(f"Error processing {row_id}: {e}")

    conn.commit()
    conn.close()
    print(f"Repair complete. Updated {updated_count} records.")

if __name__ == '__main__':
    repair_employees()

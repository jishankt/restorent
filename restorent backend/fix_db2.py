import sqlite3
import json

def fix_tenancy():
    conn = sqlite3.connect(r'c:\manoj\backend\restaurant-pos-backend\restaurant.db')
    cur = conn.cursor()
    
    tables_to_check = ['employee_designations', 'employee_types', 'departments', 'employee_departments']
    
    for table in tables_to_check:
        try:
            rows = cur.execute(f"SELECT id, data FROM {table}").fetchall()
            updated_count = 0
            for row_id, row_data in rows:
                if not row_data: continue
                try:
                    d = json.loads(row_data)
                    c_names = d.get('company_names', [])
                    
                    needs_update = False
                    
                    # If 'All' is in the array, but there are OTHER specific companies
                    if 'All' in c_names and len(c_names) > 1:
                        c_names.remove('All')
                        d['company_names'] = c_names
                        d['company_name'] = c_names[0]
                        d['company'] = c_names[0]
                        needs_update = True
                        
                    elif 'All' in c_names and len(c_names) == 1:
                        # It is genuinely just 'All'
                        pass
                        
                    if needs_update:
                        new_data = json.dumps(d)
                        cur.execute(f"UPDATE {table} SET data = ? WHERE id = ?", (new_data, row_id))
                        updated_count += 1
                        print(f"Fixed record {row_id} in {table}: Cleaned array to {c_names}")
                        
                except Exception as e:
                    print(f"Error parsing row in {table}: {e}")
            
            conn.commit()
            print(f"Completed {table}. Fixed {updated_count} records.")
        except Exception as e:
            print(f"Could not process table {table}: {e}")
            
    conn.close()

if __name__ == '__main__':
    fix_tenancy()

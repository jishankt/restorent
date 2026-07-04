import sqlite3
import json

def restore_arjun():
    conn = sqlite3.connect('restaurant.db')
    cur = conn.cursor()
    
    # Record mappings
    # CO0001 should stay in companyone
    # KY0001 must go back to KyleSolution
    
    tables = ['new_employee', 'users']
    for table in tables:
        rows = cur.execute(f"SELECT id, data FROM {table}").fetchall()
        for rid, rdata in rows:
            d = json.loads(rdata)
            if d.get('email') == 'arjun@gmail.com' or d.get('employeeId') in ['KY0001', 'CO0001']:
                emp_id = d.get('employeeId', '')
                if emp_id.startswith('KY'):
                    # Restore to KyleSolution
                    d['company'] = 'KyleSolution'
                    d['company_name'] = 'KyleSolution'
                    d['company_names'] = ['KyleSolution']
                    d['companies'] = ['KyleSolution']
                    print(f"Restoring {emp_id} to KyleSolution")
                elif emp_id.startswith('CO'):
                    # Ensure stays in companyone
                    d['company'] = 'companyone'
                    d['company_name'] = 'companyone'
                    d['company_names'] = ['companyone']
                    d['companies'] = ['companyone']
                    print(f"Maintaining {emp_id} in companyone")
                
                # ALSO: Strip 'all' from branches to test strict branch isolation later
                # For now, let's keep them explicit if possible, or leave as 'all' and let the filter handle it.
                # Actually the user said "kyle oda brach odathu" so let's make sure they are distinct.
                
                cur.execute(f"UPDATE {table} SET data=? WHERE id=?", (json.dumps(d), rid))
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    restore_arjun()

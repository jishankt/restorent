import sqlite3
import json

def cleanup():
    conn = sqlite3.connect('restaurant.db')
    cur = conn.cursor()
    
    remaining = ['companyone']
    update_set = {
        'company_names': remaining, 
        'companies': remaining, 
        'company': 'companyone', 
        'company_name': 'companyone',
        'branch': 'all',
        'branch_name': 'all',
        'branch_names': ['all']
    }
    
    # Tables to check
    tables = ['new_employee', 'users']
    
    for table in tables:
        rows = cur.execute(f'SELECT id, data FROM {table}').fetchall()
        count = 0
        for rid, rdata in rows:
            d = json.loads(rdata)
            if d.get('email') == 'arjun@gmail.com':
                d.update(update_set)
                # Ensure 'All' is completely removed from any field
                for key in ['companies', 'company_names', 'company', 'company_name']:
                    val = d.get(key)
                    if isinstance(val, list):
                        d[key] = [v for v in val if str(v).lower() != 'all']
                    elif str(val).lower() == 'all':
                        d[key] = remaining[0]
                
                cur.execute(f'UPDATE {table} SET data=? WHERE id=?', (json.dumps(d), rid))
                count += 1
        print(f"Cleaned {count} records in {table}")
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    cleanup()

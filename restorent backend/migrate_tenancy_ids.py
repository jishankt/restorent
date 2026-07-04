import sqlite3, json, re

conn = sqlite3.connect(r'c:\manoj\backend\restaurant.db')
cursor = conn.cursor()

def get_doc(table, query):
    # extremely naive finding for script
    cursor.execute(f"SELECT data FROM {table}")
    for row in cursor.fetchall():
        d = json.loads(row[0])
        match = True
        for k, v in query.items():
            if isinstance(v, dict) and '$regex' in v:
                pat = v['$regex']
                if not re.search(pat, str(d.get(k, '')), re.IGNORECASE):
                    match = False
                    break
            elif d.get(k) != v:
                match = False
                break
        if match:
            return d
    return None

def migrate_table(table):
    cursor.execute(f"SELECT rowid, data FROM {table}")
    rows = cursor.fetchall()
    updated = 0
    
    tenant_id_fallback = "634ac6f5-b6f1-4823-a8d7-ae032b3761ee" # User's default tenant
    
    for rowid, data_str in rows:
        d = json.loads(data_str)
        changed = False
        
        if not d.get('tenant_id'):
            d['tenant_id'] = tenant_id_fallback
            changed = True
            
        c_name = d.get('company_name') or (d.get('company_names') or [None])[0]
        if c_name and not d.get('company_id'):
            c_doc = get_doc('companies', {'company_name': {'$regex': f'^{re.escape(str(c_name))}$'}})
            if c_doc:
                d['company_id'] = c_doc.get('_id')
                changed = True
                
        b_name = d.get('branch_name') or (d.get('branch_names') or [None])[0]
        if b_name and d.get('company_id') and not d.get('branch_id'):
            b_doc = get_doc('branches', {'company_id': d.get('company_id'), 'branch_name': {'$regex': f'^{re.escape(str(b_name))}$'}})
            if b_doc:
                d['branch_id'] = b_doc.get('_id')
                changed = True
                
        if changed:
            cursor.execute(f"UPDATE {table} SET data = ? WHERE rowid = ?", (json.dumps(d), rowid))
            updated += 1
            
    conn.commit()
    print(f"Migrated {updated} records in {table}")

migrate_table('item_groups')
migrate_table('kitchens')
migrate_table('customer_groups')

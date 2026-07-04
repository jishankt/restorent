import sqlite3
import json

def migrate():
    conn = sqlite3.connect('restaurant.db')
    cur = conn.cursor()
    tables = ['workflow_visibility', 'module_visibility', 'users', 'branches', 'company_details']
    updated = 0
    
    for table in tables:
        try:
            rows = cur.execute(f"SELECT id, data FROM {table}").fetchall()
            for row_id, data in rows:
                doc = json.loads(data)
                changed = False
                
                # Check all keys and values
                def check_recursive(obj):
                    nonlocal changed
                    if isinstance(obj, dict):
                        for k, v in list(obj.items()):
                            if isinstance(v, str) and ('KyleSoution' in v or 'kyle soution' in v.lower()):
                                # Handle exact case mapping for KyleSolution
                                if 'KyleSoution' in v:
                                    obj[k] = v.replace('KyleSoution', 'KyleSolution')
                                else:
                                    obj[k] = v.replace('kyle soution', 'KyleSolution').replace('Kyle soution', 'KyleSolution')
                                changed = True
                            elif isinstance(v, (dict, list)):
                                check_recursive(v)
                    elif isinstance(obj, list):
                        for i, v in enumerate(obj):
                            if isinstance(v, str) and ('KyleSoution' in v or 'kyle soution' in v.lower()):
                                if 'KyleSoution' in v:
                                    obj[i] = v.replace('KyleSoution', 'KyleSolution')
                                else:
                                    obj[i] = v.replace('kyle soution', 'KyleSolution').replace('Kyle soution', 'KyleSolution')
                                changed = True
                            elif isinstance(v, (dict, list)):
                                check_recursive(v)

                check_recursive(doc)
                
                if changed:
                    cur.execute(f"UPDATE {table} SET data = ? WHERE id = ?", (json.dumps(doc), row_id))
                    updated += 1
        except Exception as e:
            print(f"Error migrating table {table}: {e}")

    conn.commit()
    conn.close()
    print(f"Migration complete. Updated {updated} records.")

if __name__ == "__main__":
    migrate()

import sqlite3
import json

db_path = 'restaurant.db'

def final_cleanup():
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Remove duplicate kylesolution records (keep the first one)
    cur.execute("SELECT id, data FROM doctypes")
    rows = cur.fetchall()
    
    seen = {} # (name, company_set) -> id
    to_delete = []

    for row_id, row_data in rows:
        data = json.loads(row_data)
        name = data.get('name')
        companies = tuple(sorted(data.get('company_names', [])))
        
        key = (name, companies)
        if key in seen:
            to_delete.append(row_id)
            print(f"Found duplicate for {name} ({companies}): {row_id}")
        else:
            seen[key] = row_id

    # 2. Remove records with empty company_names (except if they are legacy and we want them, but usually we don't)
    for row_id, row_data in rows:
        data = json.loads(row_data)
        if 'company_names' in data and not data['company_names']:
             to_delete.append(row_id)
             print(f"Found empty company record: {row_id}")

    # Deduplicate delete list
    to_delete = list(set(to_delete))
    
    for rid in to_delete:
        cur.execute("DELETE FROM doctypes WHERE id = ?", (rid,))
        print(f"Deleted record {rid}")

    conn.commit()
    conn.close()
    print("Cleanup completed.")

if __name__ == "__main__":
    final_cleanup()

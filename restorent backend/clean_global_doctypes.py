import sqlite3
import json
import os

db_path = 'restaurant.db'
doctypes_dir = 'doctypes'

def clean():
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Restore "All" versions from JSON files
    for filename in os.listdir(doctypes_dir):
        if filename.startswith('Global_') and filename.endswith('.json'):
            with open(os.path.join(doctypes_dir, filename), 'r') as f:
                clean_data = json.load(f)
            
            name = clean_data.get('name')
            # Update the record in the DB that has company_names: ["All"]
            cur.execute("SELECT id, data FROM doctypes")
            rows = cur.fetchall()
            for row_id, row_data in rows:
                data = json.loads(row_data)
                if data.get('name') == name and sorted(data.get('company_names', [])) == ["All"]:
                    # Overwrite with clean JSON data
                    clean_data['_id'] = row_id
                    cur.execute("UPDATE doctypes SET data = ? WHERE id = ?", (json.dumps(clean_data), row_id))
                    print(f"Restored clean Global version for {name}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    clean()

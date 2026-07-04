import sqlite3
import json
import os
import uuid

db_path = r'restaurant.db'
doctypes_dir = r'doctypes'

def migrate():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("CREATE TABLE IF NOT EXISTS doctypes (id TEXT PRIMARY KEY, data TEXT)")

    for filename in os.listdir(doctypes_dir):
        if filename.endswith('.json'):
            file_path = os.path.join(doctypes_dir, filename)
            with open(file_path, 'r') as f:
                doctype_data = json.load(f)
            
            name = doctype_data.get('name')
            if not name:
                print(f"Skipping {filename}: No name found")
                continue
            
            target_companies = doctype_data.get('company_names')
            if not target_companies:
                target_companies = ["All"]
            print(f"Processing {filename}: Name='{name}', Target='{target_companies}'")
            
            # Check if a record with EXACT same name AND company set exists
            cur.execute("SELECT id, data FROM doctypes")
            rows = cur.fetchall()
            
            existing_id = None
            for row_id, row_data in rows:
                data = json.loads(row_data)
                if data.get('name') == name:
                    # Compare company names list (sort to ensure order doesn't matter)
                    db_companies = data.get('company_names', ["All"])
                    if sorted(db_companies) == sorted(target_companies):
                        existing_id = row_id
                        break
            
            if existing_id:
                # Update matching tenancy version
                # Ensure we keep the _id from the database
                doctype_data['_id'] = existing_id
                cur.execute("UPDATE doctypes SET data = ? WHERE id = ?", (json.dumps(doctype_data), existing_id))
                print(f"Updated DocType: {name} (Tenancy: {target_companies})")
            else:
                # Create NEW tenancy version
                new_id = str(uuid.uuid4())
                doctype_data['_id'] = new_id
                cur.execute("INSERT INTO doctypes (id, data) VALUES (?, ?)", (new_id, json.dumps(doctype_data)))
                print(f"Created DocType: {name} (Tenancy: {target_companies})")

    conn.commit()
    conn.close()
    print("Multi-tenant migration completed successfully.")

if __name__ == "__main__":
    migrate()

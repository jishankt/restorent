import os
import json
import sqlite3

doctypes_dir = 'doctypes'
db_path = 'restaurant.db'

def consolidate():
    files = [f for f in os.listdir(doctypes_dir) if f.endswith('.json')]
    
    # Group by doctype name
    doctype_groups = {}
    
    for f in files:
        filepath = os.path.join(doctypes_dir, f)
        with open(filepath, 'r') as fp:
            try:
                data = json.load(fp)
            except:
                continue
        name = data.get('name')
        if not name:
            continue
        
        if name not in doctype_groups:
            doctype_groups[name] = []
        doctype_groups[name].append((filepath, data))
        
    for name, versions in doctype_groups.items():
        # Pick the version with the most fields
        best_version = max(versions, key=lambda x: len(x[1].get('fields', [])))
        best_filepath, best_data = best_version
        
        # Ensure it's global
        best_data['company_names'] = ["All"]
        
        # Determine the target filename
        safe_name = name.replace(" ", "_").replace("&", "").replace("__", "_").lower()
        if safe_name.endswith("_"):
            safe_name = safe_name[:-1]
        target_filename = f"Global_{safe_name}.json"
        target_filepath = os.path.join(doctypes_dir, target_filename)
        
        # Delete all files in the group
        for filepath, _ in versions:
            if os.path.exists(filepath):
                os.remove(filepath)
                
        # Write the best version to the target filename
        with open(target_filepath, 'w') as fp:
            json.dump(best_data, fp, indent=2)
            
        print(f"Consolidated '{name}' into {target_filename} (Fields: {len(best_data.get('fields', []))})")

def clean_db():
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("DELETE FROM doctypes")
    conn.commit()
    conn.close()
    print("Cleared doctypes table in database.")

if __name__ == '__main__':
    consolidate()
    clean_db()

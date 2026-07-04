import sqlite3
import json
import os
import uuid

DB_PATH = r'c:\manoj\webrestaurant\backend\restaurant.db'

def merge_users():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("Analyzing user records for duplicates...")
    
    rows = cursor.execute("SELECT id, data FROM users").fetchall()
    by_email = {}

    for row in rows:
        try:
            data = json.loads(row['data'])
            email = data.get('email', '').strip().lower()
            if not email: continue
            
            if email not in by_email:
                by_email[email] = []
            by_email[email].append({'id': row['id'], 'data': data})
        except:
            continue

    total_deleted = 0
    total_merged = 0

    for email, records in by_email.items():
        if len(records) > 1:
            print(f"Merging {len(records)} records for email: {email}")
            
            # Use the oldest or most complete record as base
            primary = records[0]
            others = records[1:]
            
            base_data = primary['data']
            
            # Extract current companies and branches
            def get_list(d, key):
                val = d.get(key, [])
                if isinstance(val, list): return set(val)
                if isinstance(val, str) and val: return {val}
                return set()

            all_companies = get_list(base_data, 'companies')
            all_branch_names = get_list(base_data, 'branch_names')
            
            # Include potential singular fields
            if base_data.get('company') and base_data.get('company') != 'All': all_companies.add(base_data.get('company'))
            if base_data.get('branch_name') and base_data.get('branch_name') != 'all': all_branch_names.add(base_data.get('branch_name'))

            for other in others:
                other_data = other['data']
                all_companies.update(get_list(other_data, 'companies'))
                all_branch_names.update(get_list(other_data, 'branch_names'))
                if other_data.get('company') and other_data.get('company') != 'All': all_companies.add(other_data.get('company'))
                if other_data.get('branch_name') and other_data.get('branch_name') != 'all': all_branch_names.add(other_data.get('branch_name'))

            # Clean up the list (remove 'All' if specific ones exist, or keep it if it's the only one)
            # Actually, keep 'All' if it's there.
            
            # Update primary
            base_data['companies'] = sorted(list(all_companies))
            base_data['branch_names'] = sorted(list(all_branch_names))
            
            # Ensure primary company is NOT 'All' if specific ones exist
            specific_comps = [c for c in base_data['companies'] if c.lower() != 'all']
            if specific_comps:
                base_data['company'] = specific_comps[0]
            
            # Update database
            cursor.execute("UPDATE users SET data = ? WHERE id = ?", (json.dumps(base_data), primary['id']))
            
            # Delete others
            for other in others:
                cursor.execute("DELETE FROM users WHERE id = ?", (other['id'],))
                total_deleted += 1
            
            total_merged += 1

    conn.commit()
    conn.close()
    print(f"Consolidation complete. Merged {total_merged} accounts, removed {total_deleted} duplicates.")

if __name__ == "__main__":
    merge_users()

import sqlite3
import json
import os

db_path = r'c:\manoj\webrestaurant\backend\restaurant.db'

def consolidate_table(conn, table_name, email_key='email'):
    cur = conn.cursor()
    print(f"\n--- Consolidating table: {table_name} ---")
    
    # 1. Fetch all records
    rows = cur.execute(f"SELECT id, data FROM {table_name}").fetchall()
    
    email_map = {} # email -> [(id, doc)]
    
    for row_id, row_data in rows:
        try:
            doc = json.loads(row_data)
            email = doc.get(email_key, '').strip().lower()
            if not email:
                continue
            if email not in email_map:
                email_map[email] = []
            email_map[email].append((row_id, doc))
        except Exception as e:
            print(f"Error parsing {table_name} record {row_id}: {e}")

    # 2. Identify duplicates
    duplicates_found = False
    for email, record_list in email_map.items():
        if len(record_list) > 1:
            duplicates_found = True
            print(f"Processing duplicates for: {email} ({len(record_list)} records found)")
            
            # Keep the first record as the primary
            primary_id, primary_doc = record_list[0]
            
            # Collect and merge arrays
            merged_companies = set()
            merged_branches = set()
            
            # Keys to check for lists/strings
            comp_keys = ['company', 'company_name', 'company_names', 'companies']
            branch_keys = ['branch', 'branch_name', 'branch_names', 'branches', 'pos_profile']
            
            def extract_to_set(doc, keys, target_set):
                for k in keys:
                    val = doc.get(k)
                    if isinstance(val, list):
                        for v in val:
                            if v: target_set.add(str(v).strip())
                    elif isinstance(val, str) and val:
                        target_set.add(val.strip())

            # Add primary's data
            extract_to_set(primary_doc, comp_keys, merged_companies)
            extract_to_set(primary_doc, branch_keys, merged_branches)
            
            # Merge from others and delete them
            for other_id, other_doc in record_list[1:]:
                extract_to_set(other_doc, comp_keys, merged_companies)
                extract_to_set(other_doc, branch_keys, merged_branches)
                
                print(f"  Deleting redundant record: {other_id}")
                cur.execute(f"DELETE FROM {table_name} WHERE id = ?", (other_id,))
            
            # Update primary doc
            sorted_comps = sorted(list(merged_companies))
            sorted_branches = sorted(list(merged_branches))
            
            primary_doc['company_names'] = sorted_comps
            primary_doc['companies'] = sorted_comps
            primary_doc['branch_names'] = sorted_branches
            primary_doc['branches'] = sorted_branches
            
            if sorted_comps:
                primary_doc['company_name'] = sorted_comps[0]
                primary_doc['company'] = sorted_comps[0]
            if sorted_branches:
                primary_doc['branch_name'] = sorted_branches[0]
                primary_doc['branch'] = sorted_branches[0]
                primary_doc['pos_profile'] = sorted_branches[0]
            
            # Save merged doc
            new_data = json.dumps(primary_doc)
            cur.execute(f"UPDATE {table_name} SET data = ? WHERE id = ?", (new_data, primary_id))
            print(f"  Merged data updated for primary record: {primary_id}")

    return duplicates_found

def cleanup_all():
    if not os.path.exists(db_path):
        print(f"Error: DB not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    
    users_changed = consolidate_table(conn, 'users')
    employees_changed = consolidate_table(conn, 'new_employee')
    
    if users_changed or employees_changed:
        conn.commit()
        print("\nChanges committed to database.")
    else:
        print("\nNo changes needed.")
        
    conn.close()

if __name__ == "__main__":
    cleanup_all()

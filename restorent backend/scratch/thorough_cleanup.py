import sqlite3
import json

def thorough_cleanup():
    db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("SELECT id, data FROM users")
    rows = cur.fetchall()
    
    for row_id, row_data in rows:
        data = json.loads(row_data)
        email = data.get('email', '')
        username = data.get('username', '')
        role = data.get('role', '')
        
        # We only clean "Individual" roles. Group Admins stay as is.
        is_individual = role in ['admin', 'company_admin', 'branch_admin', 'companyadmin', 'branchadmin']
        
        if is_individual:
            primary_comp = data.get('company') or data.get('company_name')
            companies = data.get('companies', [])
            
            # If they have multiple companies but are individual admins, 
            # we restrict their 'companies' list to ONLY their primary company.
            if primary_comp and len(companies) > 1:
                print(f"Cleaning individual admin: {email} ({username})")
                print(f"  Primary: {primary_comp}")
                print(f"  Original Companies: {companies}")
                
                # Keep only primary
                new_companies = [c for c in companies if c == primary_comp]
                if not new_companies and companies:
                    new_companies = [companies[0]] # Fallback if primary mismatch
                
                data['companies'] = new_companies
                data['company_names'] = new_companies
                
                new_json = json.dumps(data)
                cur.execute("UPDATE users SET data = ? WHERE id = ?", (new_json, row_id))
                print(f"  Updated Companies: {new_companies}")
                print("-" * 20)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    thorough_cleanup()

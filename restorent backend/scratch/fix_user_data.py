import sqlite3
import json

def fix_user():
    db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    target_email = 'admin_companytwo@internal.com'
    cur.execute("SELECT data FROM users")
    users = cur.fetchall()
    
    for row in users:
        data = json.loads(row[0])
        if data.get('email') == target_email:
            print(f"Found user: {target_email}")
            # Fix companies list
            if 'companyone' in data.get('companies', []):
                print("Removing 'companyone' from unauthorized user profile...")
                data['companies'] = [c for c in data['companies'] if c != 'companyone']
                
                # Update user.company if it's wrong (it was already companytwo in my check, but safe to ensure)
                data['company'] = 'companytwo'
                data['company_name'] = 'companytwo'
                data['company_names'] = ['companytwo']
                
                new_json = json.dumps(data)
                cur.execute("UPDATE users SET data = ? WHERE id = ?", (new_json, data['_id']))
                conn.commit()
                print("User profile updated successfully.")
            else:
                print("'companyone' not found in companies list or already removed.")
            break
            
    conn.close()

if __name__ == "__main__":
    fix_user()

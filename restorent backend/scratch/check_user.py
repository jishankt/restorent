import sqlite3
import json

def check_user():
    conn = sqlite3.connect('c:/manoj/webrestaurant/backend/restaurant.db')
    cur = conn.cursor()
    # Find all users
    cur.execute("SELECT data FROM users")
    users = [json.loads(row[0]) for row in cur.fetchall()]
    
    target_email = 'admin_companytwo@internal.com'
    found_user = None
    for u in users:
        if u.get('email') == target_email:
            found_user = u
            break
    
    if found_user:
        print(f"User found: {json.dumps(found_user, indent=2)}")
    else:
        print(f"User {target_email} not found. Available users:")
        for u in users:
            print(f"- {u.get('email')} (Company: {u.get('company') or u.get('company_name')})")

    conn.close()

if __name__ == "__main__":
    check_user()

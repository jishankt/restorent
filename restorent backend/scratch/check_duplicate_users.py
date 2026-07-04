import sqlite3
import json

def check_admin_users():
    db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("SELECT data FROM users")
    users = cur.fetchall()
    
    print("All users with username 'admin':")
    for row in users:
        data = json.loads(row[0])
        if data.get('username') == 'admin' or data.get('email') == 'admin_companytwo@internal.com':
            print(f"- ID: {data.get('_id')}")
            print(f"  Email: {data.get('email')}")
            print(f"  Company: {data.get('company')}")
            print(f"  Role: {data.get('role')}")
            print(f"  Companies: {data.get('companies')}")
            print("-" * 20)
            
    conn.close()

if __name__ == "__main__":
    check_admin_users()

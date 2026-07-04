import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- Users in KyleSolution ---")
    rows = cur.execute("SELECT data FROM users").fetchall()
    for row in rows:
        data = json.loads(row[0])
        company = data.get('company') or data.get('company_name')
        if company == 'KyleSolution':
            email = data.get('email')
            username = data.get('username')
            role = data.get('role') or data.get('user_role') or data.get('role_name')
            branch = data.get('branch') or data.get('branch_name')
            print(f"User: {username} | Email: {email} | Role: {role} | Branch: {branch}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- Users Table Content ---")
    rows = cur.execute("SELECT data FROM users").fetchall()
    for row in rows:
        data = json.loads(row[0])
        email = data.get('email')
        username = data.get('username')
        role = data.get('role') or data.get('user_role') or data.get('role_name')
        company = data.get('company') or data.get('company_name')
        branch = data.get('branch') or data.get('branch_name')
        if email == 'kyle1@gmail.com' or username == 'Kyle1':
            print(f"User: {username} | Email: {email} | Role: {role} | Company: {company} | Branch: {branch}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

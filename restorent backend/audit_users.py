import sqlite3
import json
import os

db_path = r'c:\manoj\webrestaurant\backend\restaurant.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute('SELECT data FROM users')
    rows = cursor.fetchall()
    print("USERNAME | ROLE | COMPANY | COMPANIES")
    print("-" * 50)
    for row in rows:
        u = json.loads(row[0])
        role = u.get('role', 'N/A')
        # Filter for Admins
        if 'admin' in role.lower() or 'Manager' in role:
            username = u.get('username', 'N/A')
            comp = u.get('company', 'N/A')
            comps = u.get('companies', 'N/A')
            print(f"{username} | {role} | {comp} | {comps}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

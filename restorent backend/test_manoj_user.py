import sqlite3
import json

conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = c.fetchall()
for t in tables:
    if 'user' in t[0] or 'login' in t[0] or 'register' in t[0]:
        print("Checking table:", t[0])
        try:
            c.execute(f"SELECT data FROM {t[0]}")
            for row in c.fetchall():
                try:
                    d = json.loads(row[0])
                    if d.get('_id') == 'd83416f0-477f-4550-961a-ad8be95b50c1':
                        print("FOUND MANOJ!")
                        print("branch_name:", d.get('branch_name'))
                        print("branch_names:", d.get('branch_names'))
                        print("branch:", d.get('branch'))
                except: pass
        except: pass

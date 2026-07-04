import sqlite3
import json

conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
c.execute("SELECT data FROM new_employee")
for row in c.fetchall():
    try:
        d = json.loads(row[0])
        if d.get('_id') == 'b780f681-c22a-4bf1-92c8-e960fc1187c5':
            print("FOUND NISAM!")
            print("branch_name:", d.get('branch_name'))
            print("branch_names:", d.get('branch_names'))
            print("branch:", d.get('branch'))
    except: pass

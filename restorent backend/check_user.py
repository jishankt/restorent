import sqlite3
import json
conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
c.execute("SELECT * FROM users")
for row in c.fetchall():
    doc = json.loads(row[1])
    if doc.get('email') == 'tharun@gmail.com':
        print(doc.get('email'), "Branches:", doc.get('branches'), "Branch_name:", doc.get('branch_name'))
conn.close()

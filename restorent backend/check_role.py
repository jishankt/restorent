import sqlite3
import json
conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
c.execute("SELECT * FROM role_permissions")
for row in c.fetchall():
    doc = json.loads(row[1])
    if doc.get('role') == 'BearerHead':
        print(doc.get('role'), doc.get('company'), doc.get('branch'))
conn.close()

import sqlite3, json
conn = sqlite3.connect('C:/manoj/backend/restaurant-pos-backend/restaurant.db')
cur = conn.cursor()
cur.execute("SELECT data FROM items WHERE id='7f304ee0-5291-433b-b091-f53ffd1e45aa'")
row = cur.fetchone()
if row:
    d = json.loads(row[0])
    d['is_hidden'] = False
    d['company_names'] = ['companytwo']
    d['company_name'] = 'companytwo'
    d['branch_names'] = ['test1']
    d.pop('company', None)
    d.pop('branch', None)
    cur.execute("UPDATE items SET data=? WHERE id='7f304ee0-5291-433b-b091-f53ffd1e45aa'", (json.dumps(d),))
    conn.commit()
    print("Restored!")
else:
    print("Not found")
conn.close()

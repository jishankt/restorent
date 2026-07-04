import sqlite3, json

db_path = 'C:/manoj/backend/restaurant-pos-backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("SELECT data FROM items WHERE id='7f304ee0-5291-433b-b091-f53ffd1e45aa'")
row = cur.fetchone()
if row:
    d = json.loads(row[0])
    d['is_hidden'] = False
    
    # User doesn't want it in companytwo
    d['company_names'] = ['companyone']
    d['company_name'] = 'companyone'
    if 'companytwo' in d.get('company_prices', {}):
        del d['company_prices']['companytwo']
        
    # User ONLY wants it in test1
    d['branch_names'] = ['test1']
    d['branch_name'] = 'test1'
    
    cur.execute("UPDATE items SET data=? WHERE id='7f304ee0-5291-433b-b091-f53ffd1e45aa'", (json.dumps(d),))
    conn.commit()
    print("Database fixed!")
else:
    print("Not found")

conn.close()

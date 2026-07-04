import sqlite3, json
conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
c.execute("SELECT data FROM company_details WHERE json_extract(data, '$.company_name') = 'companythree'")
row = c.fetchone()
if row:
    print('Company three exists:', json.loads(row[0]))
else:
    print('Company three does NOT exist in company_details!')

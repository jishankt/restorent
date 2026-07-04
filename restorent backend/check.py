import sqlite3
import json
conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
c.execute("SELECT json_extract(document, '$.branch_name'), json_extract(document, '$.company_name'), json_extract(document, '$.branch') FROM collections WHERE collection_name='kitchens'")
print(c.fetchall())
conn.close()

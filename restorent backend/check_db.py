import sqlite3

conn = sqlite3.connect('C:\\manoj\\backend\\restaurant-pos-backend\\restaurant.db')
cur = conn.cursor()

rows = cur.execute("SELECT data FROM item_groups").fetchall()
for row in rows:
    print(row[0])

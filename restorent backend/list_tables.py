import sqlite3
conn = sqlite3.connect('restaurant_pos.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
rows = cursor.fetchall()
for r in rows:
    print(r[0])
conn.close()

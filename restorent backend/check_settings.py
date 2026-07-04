import sqlite3
conn = sqlite3.connect('restaurant.db')
cur = conn.cursor()
cur.execute("SELECT id, data FROM system_settings WHERE id='system_settings'")
print(cur.fetchall())

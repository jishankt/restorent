import sqlite3
import json
conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("TABLES:", c.fetchall())
try:
    c.execute("SELECT * FROM kitchens")
    print("KITCHENS:", c.fetchall())
except Exception as e:
    print(e)
conn.close()

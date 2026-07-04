import sqlite3
import json

db_path = "restaurant.db"
conn = sqlite3.connect(db_path)
cursor = conn.conn.cursor() if hasattr(conn, 'conn') else conn.cursor()

print("--- role_permissions Table ---")
cursor.execute("SELECT * FROM role_permissions LIMIT 10")
for row in cursor.fetchall():
    print(row[0], "-->", row[1][:120])

conn.close()

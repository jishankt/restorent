import sqlite3
import json

db_path = 'C:/manoj/backend/restaurant-pos-backend/restaurant.db'

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT data FROM branches")
rows = cursor.fetchall()
for r in rows:
    data = json.loads(r[0])
    print(f"Company: {data.get('company')}, Branch: {data.get('branch_name')}")

conn.close()

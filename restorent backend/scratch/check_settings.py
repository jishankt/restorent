import sqlite3
import json

def check():
    conn = sqlite3.connect('c:/manoj/webrestaurant/backend/restaurant.db')
    cur = conn.cursor()
    cur.execute("SELECT id, data FROM system_settings")
    rows = cur.fetchall()
    print(f"Total settings records: {len(rows)}")
    for row in rows:
        print(f"ID: {row[0]}")
        # print(f"Data: {row[1][:100]}...")
    conn.close()

if __name__ == "__main__":
    check()

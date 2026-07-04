import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
try:
    rows = cur.execute("SELECT data FROM tables").fetchall()
    types = {}
    for row in rows:
        data = json.loads(row[0])
        tn = data.get('table_number')
        t_type = str(type(tn))
        types[t_type] = types.get(t_type, 0) + 1
    print(json.dumps(types, indent=2))
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

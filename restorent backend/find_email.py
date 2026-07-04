import sqlite3
import json

conn = sqlite3.connect('restaurant.db')
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in cur.fetchall()]
print('All tables:', tables)

for t in tables:
    try:
        cur.execute(f"SELECT data FROM {t}")
        rows = cur.fetchall()
        for row in rows:
            try:
                d = json.loads(row[0])
                val = str(d).lower()
                if 'companyone' in val or 'company one' in val:
                    print(f'\n[TABLE: {t}] Found match:')
                    print(json.dumps(d, indent=2))
            except:
                pass
    except Exception as e:
        print(f'[{t}] Error: {e}')

conn.close()
print('\nDone.')

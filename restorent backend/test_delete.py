import sqlite3
import json

conn = sqlite3.connect('restaurant.db')
cur = conn.cursor()
rows = cur.execute("SELECT id, data FROM email_tokens").fetchall()

email = "manojmanoj88680@gmail.com"
filter = {'email': email, 'type': 'otp'}

def matches(doc, filter):
    for key, value in filter.items():
        doc_val = doc.get(key)
        if doc_val != value:
            return False
    return True

count = 0
for row_id, row_data in rows:
    d = json.loads(row_data)
    if matches(d, filter):
        print(f"Executing DELETE for {row_id}")
        cur.execute("DELETE FROM email_tokens WHERE id = ?", (row_id,))
        count += 1
        
conn.commit()
print(f"Deleted {count} rows")

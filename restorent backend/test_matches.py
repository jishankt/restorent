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

for row_id, row_data in rows:
    d = json.loads(row_data)
    print(f"Checking doc: {d['email']} | {d['type']}")
    print(f"Match: {matches(d, filter)}")

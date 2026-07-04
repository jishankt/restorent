import sqlite3
import json

db_path = r'c:\manoj\webrestaurant\backend\restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

user_id = '0bde9411-58ea-4ed3-9b06-1c3c110dfb61'
cur.execute("SELECT data FROM users WHERE id = ?", (user_id,))
row = cur.fetchone()

if row:
    data = json.loads(row[0])
    data['company'] = 'companyone'
    data['company_name'] = 'companyone'
    data['companies'] = ['companyone']
    data['company_names'] = ['companyone']
    
    # Also fix worker record if exists
    cur.execute("SELECT id, data FROM new_employee WHERE data LIKE '%Arjun%'")
    workers = cur.fetchall()
    for w_id, w_data in workers:
        w_json = json.loads(w_data)
        if w_json.get('email') == 'arjun@gmail.com':
            w_json['company'] = 'companyone'
            w_json['company_name'] = 'companyone'
            w_json['companies'] = ['companyone']
            w_json['company_names'] = ['companyone']
            cur.execute("UPDATE new_employee SET data = ? WHERE id = ?", (json.dumps(w_json), w_id))

    cur.execute("UPDATE users SET data = ? WHERE id = ?", (json.dumps(data), user_id))
    conn.commit()
    print("Successfully updated Arjun's records to companyone")
else:
    print("Arjun not found")

conn.close()

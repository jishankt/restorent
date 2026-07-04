import sqlite3
import json

db_path = r'c:\manoj\webrestaurant\backend\restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

def fix_manoj(data_str):
    data = json.loads(data_str)
    if 'manoj' in str(data.get('username', '')).lower() or 'manoj' in str(data.get('name', '')).lower():
        data['company'] = 'companytwo'
        data['company_name'] = 'companytwo'
        data['companies'] = ['companytwo']
        data['company_names'] = ['companytwo']
        data['employeeId'] = 'CT0001'
        print(f"Fixed Manoj to companytwo and CT0001")
    return json.dumps(data)

cur.execute("SELECT id, data FROM new_employee")
for row_id, d in cur.fetchall():
    cur.execute("UPDATE new_employee SET data = ? WHERE id = ?", (fix_manoj(d), row_id))

cur.execute("SELECT id, data FROM users")
for row_id, d in cur.fetchall():
    cur.execute("UPDATE users SET data = ? WHERE id = ?", (fix_manoj(d), row_id))

conn.commit()
conn.close()

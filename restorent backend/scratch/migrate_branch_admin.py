import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- Running Migration ---")
    
    # 1. Update kyle1@gmail.com to branch_admin
    res = cur.execute("SELECT id, data FROM users").fetchall()
    for row in res:
        uid, data_str = row
        data = json.loads(data_str)
        if data.get('email') == 'kyle1@gmail.com' and data.get('role') == 'Cashier':
            print(f"Updating user {data.get('username')} (kyle1@gmail.com) to branch_admin...")
            data['role'] = 'branch_admin'
            data['firstName'] = data.get('firstName', '').replace('Cashier', 'Admin')
            cur.execute("UPDATE users SET data = ? WHERE id = ?", (json.dumps(data), uid))
    
    # 2. Delete empty workflow_visibility for Kyle1
    print("Cleaning up empty Kyle1 workflow settings...")
    cur.execute("DELETE FROM workflow_visibility WHERE json_extract(data, '$.company_name') = 'KyleSolution' AND json_extract(data, '$.branch_name') = 'Kyle1'")
    
    conn.commit()
    print("Migration completed successfully.")

except Exception as e:
    import traceback
    print(f"Error during migration: {e}")
    traceback.print_exc()
    conn.rollback()
finally:
    conn.close()

import sqlite3
import json

def find_user(email):
    conn = sqlite3.connect('pos_database.db')
    cur = conn.cursor()
    # Assuming users collection is the 'users' table or similar. 
    # I saw 'users' was one of the collection names.
    try:
        cur.execute("SELECT data FROM users")
        rows = cur.fetchall()
        for row in rows:
            doc = json.loads(row[0])
            if doc.get('email') == email:
                print(f"User Found: {json.dumps(doc, indent=2)}")
                return
        print("User NOT found in 'users' table.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

find_user("arjun@gmail.com")

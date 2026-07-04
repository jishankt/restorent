import sqlite3
import json

def debug_db():
    try:
        conn = sqlite3.connect('c:\\manoj\\webrestaurant\\backend\\restaurant.db')
        cur = conn.cursor()
        
        # Check table names
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cur.fetchall()
        print("Tables:", tables)
        
        if ('system_settings',) in tables:
            cur.execute("SELECT id, data FROM system_settings")
            rows = cur.fetchall()
            print(f"Found {len(rows)} records in system_settings")
            for row_id, row_data in rows:
                print(f"ID: {row_id}")
                try:
                    data = json.loads(row_data)
                    print(f"  Company: {data.get('company_name')}, Branch: {data.get('branch_name')}")
                except:
                    print(f"  Data: {row_data[:100]}...")
        else:
            print("system_settings table NOT FOUND")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_db()

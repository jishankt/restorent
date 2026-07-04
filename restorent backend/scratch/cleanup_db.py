import sqlite3
import json
import os

db_path = r'C:\manoj\webrestaurant\backend\restaurant.db'

def cleanup_items():
    if not os.path.exists(db_path):
        print(f"Error: DB not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # 1. Find the ID of the item to keep (item_code: 0001)
    rows = cur.execute("SELECT id, data FROM items").fetchall()
    keep_id = None
    for row_id, row_data in rows:
        try:
            doc = json.loads(row_data)
            if doc.get('item_code') == '0001':
                keep_id = row_id
                print(f"Found item to keep: {doc.get('item_name')} ({keep_id})")
                break
        except:
            continue
            
    if not keep_id:
        print("Warning: Item code '0001' not found. Keeping the first item instead.")
        if rows:
            keep_id = rows[0][0]
        else:
            print("Database is already empty.")
            conn.close()
            return

    # 2. Delete all other items
    cur.execute("DELETE FROM items WHERE id != ?", (keep_id,))
    conn.commit()
    
    # 3. Verify
    remaining = cur.execute("SELECT count(*) FROM items").fetchone()[0]
    print(f"Cleanup complete. Remaining items: {remaining}")
    conn.close()

if __name__ == "__main__":
    cleanup_items()

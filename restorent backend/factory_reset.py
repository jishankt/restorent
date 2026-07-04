import sqlite3
import os

def factory_reset():
    db_path = 'restaurant.db'
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    # We DO NOT want to delete configuration tables!
    # Doctypes and Address Structures are needed for the app to function.
    safe_to_keep = [
        'sqlite_sequence', 
        'doctypes', 
        'address_structures', 
        'role_permissions', 
        'system_settings', 
        'module_visibility', 
        'workflow_visibility',
        'series_settings'
    ]
    
    print("SQLite Tables:")
    for table in tables:
        table_name = table[0]
        if table_name not in safe_to_keep:
            print(f"Dropping SQLite Table: {table_name}")
            cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
        else:
            print(f"Keeping SQLite Table: {table_name}")
            
    conn.commit()
    conn.close()
    
    print("Factory Reset Complete!")

if __name__ == '__main__':
    factory_reset()

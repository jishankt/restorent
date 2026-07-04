import sqlite3
import json

db_path = "restaurant.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def print_table(table_name):
    print(f"\n--- TABLE: {table_name} ---")
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';")
    if not cursor.fetchone():
        print(f"Table {table_name} does not exist.")
        return
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    # Get column names
    cursor.execute(f"PRAGMA table_info({table_name});")
    cols = [col[1] for col in cursor.fetchall()]
    print("Columns:", cols)
    for row in rows[:20]: # print first 20 rows
        print(row)

print_table("kitchens")
print_table("item_groups")
print_table("company_details")

conn.close()

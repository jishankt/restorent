"""
Find exact Bearer record IDs so we can delete duplicates.
"""
import sqlite3, json

conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
c.execute("PRAGMA table_info(role_permissions)")
cols = c.fetchall()
print("Columns:", [col[1] for col in cols])

c.execute("SELECT * FROM role_permissions")
rows = c.fetchall()
print(f"\nTotal records: {len(rows)}")
for i, row in enumerate(rows):
    doc = json.loads(row[1])
    role = doc.get('role', 'N/A')
    company = doc.get('company', 'N/A')
    perms = doc.get('permissions', [])
    own_pages = [p['pageId'] for p in perms if p.get('dataAccess') in ['OWN', 'HIERARCHY'] and p.get('canRead')]
    print(f"[{i}] Role: {role} | Company: {company} | Total perms: {len(perms)} | OWN pages: {len(own_pages)}")
conn.close()

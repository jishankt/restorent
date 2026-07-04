"""
DB Cleanup + Fix:
1. Delete duplicate BearerHead records — keep only the latest one with 69 perms + 12 OWN pages
2. Delete the duplicate Bearer record with 65 perms (no OWN) — keep only the one with 69 perms + OWN
3. Show final state
"""
import sqlite3, json

conn = sqlite3.connect('restaurant.db')
c = conn.cursor()

c.execute("SELECT id, data FROM role_permissions ORDER BY id ASC")
rows = c.fetchall()
print(f"Before cleanup: {len(rows)} records\n")

# Categorize records by (role, company)
from collections import defaultdict
groups = defaultdict(list)
for row_id, data_str in rows:
    doc = json.loads(data_str)
    role = doc.get('role', '')
    company = doc.get('company', 'N/A')
    perms = doc.get('permissions', [])
    own_count = sum(1 for p in perms if p.get('dataAccess') in ['OWN', 'HIERARCHY'] and p.get('canRead'))
    groups[(role, company)].append({
        'id': row_id,
        'perm_count': len(perms),
        'own_count': own_count,
        'doc': doc
    })

ids_to_delete = []

for (role, company), records in groups.items():
    if len(records) <= 1:
        continue
    print(f"Duplicates found for Role='{role}' Company='{company}':")
    # Strategy: Keep the record with the most OWN pages AND most permissions (most complete/latest config)
    # Sort: most OWN first, then most perms
    sorted_records = sorted(records, key=lambda r: (r['own_count'], r['perm_count']), reverse=True)
    keep = sorted_records[0]
    delete = sorted_records[1:]
    print(f"  Keep: id={keep['id']} (perms={keep['perm_count']}, own={keep['own_count']})")
    for d in delete:
        print(f"  DELETE: id={d['id']} (perms={d['perm_count']}, own={d['own_count']})")
        ids_to_delete.append(d['id'])

print(f"\nDeleting {len(ids_to_delete)} duplicate records: {ids_to_delete}")
for del_id in ids_to_delete:
    c.execute("DELETE FROM role_permissions WHERE id = ?", (del_id,))
conn.commit()

# Also fix the generic 'bearer' (all lowercase, company=N/A) record
# This is a template — it's ok to keep but it should not interfere
# The issue is it has 0 OWN pages — it's the DEFAULT template
# We can keep it as a fallback template

c.execute("SELECT id, data FROM role_permissions ORDER BY id ASC")
remaining = c.fetchall()
print(f"\nAfter cleanup: {len(remaining)} records")
for row_id, data_str in remaining:
    doc = json.loads(data_str)
    role = doc.get('role', '')
    company = doc.get('company', 'N/A')
    perms = doc.get('permissions', [])
    own_count = sum(1 for p in perms if p.get('dataAccess') in ['OWN', 'HIERARCHY'] and p.get('canRead'))
    print(f"  id={row_id} Role='{role}' Company='{company}' perms={len(perms)} own={own_count}")

conn.close()
print("\nDone!")

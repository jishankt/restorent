import sqlite3, json

db_path = r'C:\manoj\backend\restaurant.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

TENANT_ID   = '634ac6f5-b6f1-4823-a8d7-ae032b3761ee'
COMPANY_ID  = '2ee4130a-f200-416f-b707-f332db465e26'
COMPANY_NM  = 'Hot Burger India Pvt Ltd'

cursor.execute("SELECT id, data FROM customer_groups")
rows = cursor.fetchall()

for row in rows:
    data = json.loads(row[1])
    gid  = row[0]
    tid  = data.get('tenant_id')
    changed = False

    # Delete old orphan records (no tenant_id) - these are legacy junk
    if not tid:
        cursor.execute("DELETE FROM customer_groups WHERE id = ?", (gid,))
        print(f"Deleted orphan group: {data.get('group_name')} (id={gid})")
        continue

    # For groups that belong to our tenant but have no company → assign Hot Burger India
    if tid == TENANT_ID:
        if not data.get('company_names') or data.get('company_names') == []:
            data['company_names'] = [COMPANY_NM]
            data['company_name']  = COMPANY_NM
            data['company_id']    = COMPANY_ID
            changed = True
            print(f"Assigned company to: {data.get('group_name')} (id={gid})")

        # Ensure branch_names is at least an empty list (not None)
        if data.get('branch_names') is None:
            data['branch_names'] = []
            data['branch_name']  = ''
            changed = True

    if changed:
        cursor.execute("UPDATE customer_groups SET data = ? WHERE id = ?", (json.dumps(data), gid))

conn.commit()
print("\nDone. Final state:")
cursor.execute("SELECT id, data FROM customer_groups")
for row in cursor.fetchall():
    d = json.loads(row[1])
    print(f"  {d.get('group_name')} | company={d.get('company_names')} | branch={d.get('branch_names')} | tenant={d.get('tenant_id','N/A')[:8]}")
conn.close()

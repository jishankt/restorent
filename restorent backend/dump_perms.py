import sqlite3
import json
conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
c.execute("SELECT data FROM role_permissions WHERE data LIKE '%bearer%'")
rows = c.fetchall()
for r in rows:
    data = json.loads(r[0])
    if data.get('role') == 'BearerHead':
        print(f"Role: {data.get('role')} | Company: {data.get('company')} | Branch: {data.get('branch')} | Accessible: {data.get('accessible_designations')}")
        perms = data.get('permissions', [])
        emp_perm = next((p for p in perms if p.get('pageId') == 'employee_list'), None)
        att_perm = next((p for p in perms if p.get('pageId') == 'create_attendance'), None)
        roster_perm = next((p for p in perms if p.get('pageId') == 'roaster'), None)
        print(f"  Employee List Perm: {emp_perm}")
        print(f"  Create Attendance Perm: {att_perm}")
        print(f"  Roaster Perm: {roster_perm}")

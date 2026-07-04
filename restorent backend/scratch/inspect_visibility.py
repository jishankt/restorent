import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

def extreme_norm(val):
    if isinstance(val, list):
        val = val[0] if val else ""
    s = str(val or "").strip().lower()
    return s.replace(' ', '').replace('_', '').replace('-', '')

try:
    print("--- Workflow Visibility Table Content ---")
    rows = cur.execute("SELECT data FROM workflow_visibility").fetchall()
    for row in rows:
        data = json.loads(row[0])
        company = data.get('company_name')
        branch = data.get('branch_name')
        settings = data.get('settings', {})
        print(f"Company: {company} | Branch: {branch} | Settings Keys: {list(settings.keys())}")
        if company == 'KyleSolution':
             print(f"  NORM Company: {extreme_norm(company)}")
             if branch:
                 print(f"  NORM Branch: {extreme_norm(branch)}")

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

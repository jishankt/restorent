import sqlite3, json
conn = sqlite3.connect('restaurant.db')
c = conn.cursor()
try:
    c.execute("SELECT data FROM company_details")
    for row in c:
        data = json.loads(row[0])
        if data.get('restaurantName') == 'kyle' or data.get('company_name') == 'kyle':
            print(f"tenant_id: {data.get('tenant_id')}")
except Exception as e:
    print(e)

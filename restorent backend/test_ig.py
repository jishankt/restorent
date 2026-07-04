import urllib.request
import json

def fetch():
    try:
        req = urllib.request.Request('http://localhost:3000/api/item-groups')
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print("Item Groups:", [ (g.get('group_name'), g.get('company_name'), g.get('branch_name')) for g in data ])
    except Exception as e:
        print("Error:", e)

fetch()

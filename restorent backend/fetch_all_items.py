import urllib.request, json
req = urllib.request.Request('http://127.0.0.1:6034/api/items', headers={'X-Company-Name': 'All', 'Authorization': 'Bearer dummy'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f'Total Count: {len(data)}')
        for item in data:
            print(f"Name: {item.get('item_name')}, Company: {item.get('company_name')}")
except Exception as e:
    print(e)

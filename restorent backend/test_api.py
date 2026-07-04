import requests
import json

headers = {'X-Company-Name': 'All', 'X-Branch-Name': 'All Branches'}

print("Saving permissions...")
r = requests.post('http://localhost:3000/api/role-permissions', json={
    'role': 'BearerHead', 
    'permissions': [
        {'pageId': 'opening_entry', 'canRead': False, 'canWrite': False, 'canCreate': False, 'canDelete': False, 'dataAccess': 'ALL'}
    ], 
    'accessible_designations': []
}, headers=headers)
print(r.text)

print("Fetching permissions...")
r2 = requests.get('http://localhost:3000/api/role-permissions?role=BearerHead', headers=headers)
print(r2.text)

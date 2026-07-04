import requests

headers = {'X-Company-Name': 'KYLE1', 'X-Branch-Name': 'KYLE1'}
r2 = requests.get('http://localhost:3000/api/role-permissions?role=BearerHead', headers=headers)
print('GET with branch KYLE1:', r2.text)

import requests

url = "http://localhost:6034/api/branches?company_name=companyone"
headers = {"X-Company-Name": "companyone"}
r = requests.get(url, headers=headers)
print(r.status_code)
print(r.json())

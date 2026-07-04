import requests
url = "http://localhost:3000/api/workflow-visibility"
data = {"company_name": "kyle", "branch_name": "undefined", "settings": {}}
response = requests.post(url, json=data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

import requests
res = requests.post("http://127.0.0.1:6034/api/login", json={"email": "company@gmail.com", "password": "admin"})
print(res.text)

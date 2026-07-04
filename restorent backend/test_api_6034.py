import requests
url = "http://127.0.0.1:6034/api/employees?role=BearerHead&company=companyone&branch="
headers = {
    "X-Company-Name": "companyone",
    "X-User-Id": "d83416f0-477f-4550-961a-ad8be95b50c1",
    "X-Role": "BearerHead",
    "X-Branch-Name": "All",
    "Authorization": "Bearer J8UUlDAE2K1ePN2f4Z2Sf4fLJDM6AgZ0Q1aIzD4468k"
}
try:
    res = requests.get(url, headers=headers)
    print("Status:", res.status_code)
    data = res.json()
    print("Count:", len(data))
    for d in data:
        print("Employee:", d.get('name'))
except Exception as e:
    print("Error:", e)

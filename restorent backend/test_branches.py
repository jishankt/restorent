import requests
import json

res = requests.get('http://localhost:3000/api/branches?company_name=Hot+Burger+India+Pvt+Ltd')
print("India:", res.text)

res2 = requests.get('http://localhost:3000/api/branches?company_name=Hot+Burger+UAE+LLC')
print("UAE:", res2.text)

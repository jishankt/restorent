import requests
try:
    headers = {'X-Company-Name': 'All', 'Authorization': 'Bearer <if needed>'}
    # Wait, getting data scope filter uses g.user_id, which requires JWT!
    # Without JWT, user_id is None, and get_data_scope_filter returns False, {"STRICT_DENY_NO_USER": True}
    res = requests.get('http://localhost:6034/api/sales', headers=headers)
    print(res.json())
except Exception as e:
    print(e)

from app1 import get_data_scope_filter, app, get_request_user_info
from flask import request

ctx = app.test_request_context(headers={
    'X-Company-Name': 'KYLE1',
    'X-Branch-Name': 'All Branches',
    'X-User-Context': '{"role": "BearerHead", "email": "tharun@gmail.com", "_id": "60a7d9e4f1b2c4d5e6f7a8b9", "company_name": "KYLE1", "branch_name": "All Branches"}'
})
ctx.push()

print("Result:", get_data_scope_filter('add_kitchen'))

"""
Deep investigation: Why is Bearer (Manoj) not getting OWN filter applied?
Check what access_type is resolved to and why.
"""
from app1 import get_data_scope_filter, app, get_request_user_info, allow_access, get_request_company

ctx = app.test_request_context(headers={
    'X-Company-Name': 'KYLE1',
    'X-Branch-Name': 'All Branches',
    'X-User-Context': '{"role": "Bearer", "email": "manoj@gmail.com", "_id": "manoj-id-000", "company_name": "KYLE1", "branch_name": "All Branches"}'
})
ctx.push()

user_id, role = get_request_user_info()
active_company = get_request_company()
print(f"User ID: {user_id}")
print(f"Role: {role}")
print(f"Company: {active_company}")

# Check what allow_access returns for leave_apply
can_access, access_type = allow_access('leave_apply', active_company=active_company)
print(f"\nallow_access('leave_apply') -> can_access={can_access}, access_type={access_type}")

can_access, access_type = allow_access('employee_list', active_company=active_company)
print(f"allow_access('employee_list') -> can_access={can_access}, access_type={access_type}")

can_access, access_type = allow_access('salary_slip', active_company=active_company)
print(f"allow_access('salary_slip') -> can_access={can_access}, access_type={access_type}")

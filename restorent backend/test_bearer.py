"""
Test Bearer (Manoj) access - should show OWN data only.
"""
from app1 import get_data_scope_filter, app

ctx = app.test_request_context(headers={
    'X-Company-Name': 'KYLE1',
    'X-Branch-Name': 'All Branches',
    'X-User-Context': '{"role": "Bearer", "email": "manoj@gmail.com", "_id": "manoj-id-000", "company_name": "KYLE1", "branch_name": "All Branches"}'
})
ctx.push()

pages_to_test = [
    ('employee_list', '_id'),
    ('roaster', 'employee_id'),
    ('salary_slip', 'employeeId'),
    ('leave_apply', 'employee_id'),
    ('view_attendance', 'employee_id'),
    ('create_attendance', 'employee_id'),
    ('notifications', 'userId'),
]

print("=" * 80)
print("TESTING BEARER ROLE (MANOJ) - SHOULD SEE OWN DATA ONLY")
print("=" * 80)

for page, owner_field in pages_to_test:
    try:
        can_access, filter_query = get_data_scope_filter(page, owner_field=owner_field)
        filter_str = str(filter_query)
        has_owner_filter = 'manoj' in filter_str.lower() or 'email' in filter_str.lower() or 'userId' in filter_str or 'OWN' in filter_str
        print(f"\nPage: {page}")
        print(f"  Can Access: {can_access}")
        print(f"  Has OWN filter: {has_owner_filter}")
        if has_owner_filter:
            print(f"  ✅ CORRECT - Will show only Manoj's data")
        else:
            print(f"  ❌ PROBLEM - No owner filter, will show ALL data!")
    except Exception as e:
        print(f"Page: {page} - ERROR: {e}")

print("\n" + "=" * 80)

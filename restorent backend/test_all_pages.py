"""
Test to confirm ALL pages work correctly for an employee with 'dataAccess: ALL' permissions.
This simulates a BearerHead user (employee) with All Branches context.
"""
from app1 import get_data_scope_filter, app, kitchens_collection, items_collection, worker_collection, branches_collection

ctx = app.test_request_context(headers={
    'X-Company-Name': 'KYLE1',
    'X-Branch-Name': 'All Branches',
    'X-User-Context': '{"role": "BearerHead", "email": "tharun@gmail.com", "_id": "60a7d9e4f1b2c4d5e6f7a8b9", "company_name": "KYLE1", "branch_name": "All Branches"}'
})
ctx.push()

pages_to_test = [
    'add_kitchen',
    'kitchens',
    'item_list',
    'employee_list',
    'customer_list',
    'tables',
    'add_table',
    'sales_report',
    'pos',
    'departments',
    'employee_designations',
    'employee_types',
    'schedules',
    'roaster',
    'purchase',
    'suppliers',
]

print("=" * 70)
print("TESTING ALL PAGES FOR BearerHead ROLE WITH ALL dataAccess")
print("=" * 70)
print(f"{'PAGE':<25} {'CAN_ACCESS':<12} {'BYPASS_BRANCH'}")
print("-" * 70)

for page in pages_to_test:
    try:
        can_access, filter_query = get_data_scope_filter(page)
        # Check if branch is bypassed (no branch filter in query = bypass)
        filter_str = str(filter_query)
        has_branch_filter = 'branch_name' in filter_str or 'branch_names' in filter_str
        bypass = 'YES - Company-wide' if not has_branch_filter else 'NO - Branch restricted'
        print(f"{page:<25} {str(can_access):<12} {bypass}")
    except Exception as e:
        print(f"{page:<25} ERROR: {e}")

print("=" * 70)
print("DONE. All pages should show CAN_ACCESS=True and BYPASS_BRANCH=YES - Company-wide")
print("for roles with ALL dataAccess permission on those pages.")

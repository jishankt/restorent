from app1 import get_data_scope_filter, app
import app1
import json

app1.get_request_user_info = lambda: ('75948cb7-cffe-4106-ab09-8dc8906beacd', 'Bearer')

with app.test_request_context('/api/employees?company=companyone&branch=', headers={
    'X-User-Id': '75948cb7-cffe-4106-ab09-8dc8906beacd',  # Nisam user ID
    'X-Role': 'Bearer',
    'X-Company-Name': 'companyone',
    'X-Branch-Name': 'All',
}):
    # Mocking allow access to return OWN
    app1.allow_access = lambda page_id, active_company=None: (True, 'OWN')

    can_access, filter_query = get_data_scope_filter('employee_list')
    print("NISAM CAN ACCESS:", can_access)
    print("NISAM FILTER:", json.dumps(filter_query, default=str))

app1.get_request_user_info = lambda: ('d83416f0-477f-4550-961a-ad8be95b50c1', 'BearerHead')
with app.test_request_context('/api/employees?company=companyone&branch=', headers={
    'X-User-Id': 'd83416f0-477f-4550-961a-ad8be95b50c1',  # Manoj user ID
    'X-Role': 'BearerHead',
    'X-Company-Name': 'companyone',
    'X-Branch-Name': 'All',
}):
    # Mocking allow access to return HIERARCHY
    app1.allow_access = lambda page_id, active_company=None: (True, 'HIERARCHY')

    can_access, filter_query = get_data_scope_filter('employee_list')
    print("MANOJ CAN ACCESS:", can_access)
    print("MANOJ FILTER:", json.dumps(filter_query, default=str))

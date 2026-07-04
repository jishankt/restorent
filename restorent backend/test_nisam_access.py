from app1 import get_data_scope_filter, app, get_request_user_info
import json

with app.test_request_context('/api/employees?company=companyone&branch=', headers={
    'X-User-Id': '75948cb7-cffe-4106-ab09-8dc8906beacd',  # Nisam user ID
    'X-Role': 'Bearer',
    'X-Company-Name': 'companyone',
    'X-Branch-Name': 'All',
    'Authorization': 'Bearer test'
}):
    can_access, filter_query = get_data_scope_filter('employee_list')
    print("NISAM CAN ACCESS:", can_access)
    print("NISAM FILTER:", json.dumps(filter_query, default=str))

with app.test_request_context('/api/employees?company=companyone&branch=', headers={
    'X-User-Id': 'd83416f0-477f-4550-961a-ad8be95b50c1',  # Manoj user ID
    'X-Role': 'BearerHead',
    'X-Company-Name': 'companyone',
    'X-Branch-Name': 'All',
    'Authorization': 'Bearer test'
}):
    can_access, filter_query = get_data_scope_filter('employee_list')
    print("MANOJ CAN ACCESS:", can_access)
    print("MANOJ FILTER:", json.dumps(filter_query, default=str))

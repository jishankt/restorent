import sys
import json
sys.path.append(r'c:\manoj\backend\restaurant-pos-backend')
import app1

app1.app.config['TESTING'] = True
app1.app.config['JWT_SECRET_KEY'] = 'test'

user_doc = app1.users_collection.find_one({"email": "test@gmail.com"})
user_id_str = str(user_doc['_id']) if user_doc else ""

user_ctx = json.dumps({'email': 'test@gmail.com', 'role': 'xxxx', 'company_name': 'companyone', 'branch_name': 'test1', 'userId': user_id_str})

with app1.app.test_request_context('/api/employees?pageId=employee_list&branch_name=', headers={
    'X-User-Context': user_ctx, 
    'X-Company-Name': 'companyone', 
    'X-Branch-Name': ''
}):
    can_access, filter_query = app1.get_data_scope_filter('employee_list', owner_field='_id')
    print("CAN ACCESS:", can_access)
    print("FILTER QUERY:", json.dumps(filter_query, default=str))
    
    workers = list(app1.worker_collection.find(filter_query))
    print("MATCHING WORKERS WITH EMPTY BRANCH PARAM:", len(workers))
    for w in workers:
        print(" ->", w.get('name'), w.get('branch_names'))

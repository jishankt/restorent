import sys, json
from flask import Flask, request, g
app = Flask(__name__)

with app.test_request_context(headers={'X-Company-Name': 'Kyle'}):
    import app1
    app1.get_request_user_info = lambda: ('mock_user_id', 'company_admin')
    app1.users_collection.find_one = lambda x: {'_id': 'mock_user_id', 'role': 'company_admin', 'company_name': 'Kyle'}
    
    can_access, filter_query = app1.get_data_scope_filter('sales_report')
    doc1 = {"company_name": "Kyle", "branch_name": "KYLE1(BR)", "branch": "KYLE1(BR)"}
    col = app1.sales_collection
    print("Matches filter?", col.matches_filter(doc1, filter_query))

    branch_or = filter_query['$and'][1]['$or']
    for subf in branch_or:
        if col.matches_filter(doc1, subf):
            print("MATCHED:", subf)

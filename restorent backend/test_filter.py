import sys
import json
from flask import Flask, request, g

# mock app
app = Flask(__name__)

with app.test_request_context(headers={'X-Company-Name': 'Kyle'}):
    import app1
    # Mock user info to look like Company Admin
    app1.get_request_user_info = lambda: ('mock_user_id', 'company_admin')
    app1.users_collection.find_one = lambda x: {'_id': 'mock_user_id', 'role': 'company_admin', 'company_name': 'Kyle'}
    
    can_access, filter_query = app1.get_data_scope_filter('sales_report')
    print("Filter Query:", json.dumps(filter_query, default=str))

    # Test the match!
    # SQLiteCollection._match
    mock_doc1 = {"company_name": "Kyle", "branch_name": "KYLE1(BR)"}
    mock_doc2 = {"company_name": "Kyle", "branch_name": "All Branches"}
    
    # We need to manually call matches_filter
    col = app1.sales_collection
    print("Match doc1 (KYLE1):", col.matches_filter(mock_doc1, filter_query))
    print("Match doc2 (All Branches):", col.matches_filter(mock_doc2, filter_query))

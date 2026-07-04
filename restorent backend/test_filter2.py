import sys
import json
from flask import Flask, request, g

# mock app
app = Flask(__name__)

with app.test_request_context(headers={'X-Company-Name': 'Kyle'}):
    import app1
    
    # Apply monkeypatch to fix should_bypass_branch locally
    old_get_data_scope = app1.get_data_scope_filter
    
    def my_get_data_scope_filter(page_id, owner_field='_id', default_access=False):
        # We will just patch app1 variables
        pass
        
    # Actually, let's just replace the exact lines using string replacement on app1.py and reloading it, 
    # but since it's already loaded, let's just patch the source file and reload it
    with open('app1.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We remove " or access_type == 'ALL'" from the operational pages bypass condition
    content = content.replace(
        "should_bypass_branch = ((is_global_master or access_type == 'ALL') and (not active_branch or active_branch.lower() in ['all', 'all branches', 'any'])) or is_shared_config",
        "should_bypass_branch = (is_global_master and (not active_branch or active_branch.lower() in ['all', 'all branches', 'any'])) or is_shared_config"
    )
    
    with open('app1.py', 'w', encoding='utf-8') as f:
        f.write(content)
        
    import importlib
    importlib.reload(app1)

    app1.get_request_user_info = lambda: ('mock_user_id', 'company_admin')
    app1.users_collection.find_one = lambda x: {'_id': 'mock_user_id', 'role': 'company_admin', 'company_name': 'Kyle'}
    
    can_access, filter_query = app1.get_data_scope_filter('sales_report')
    print("Filter Query AFTER FIX:", json.dumps(filter_query, default=str))

    # Test the match!
    mock_doc1 = {"company_name": "Kyle", "branch_name": "KYLE1(BR)"}
    mock_doc2 = {"company_name": "Kyle", "branch_name": "All Branches"}
    
    col = app1.sales_collection
    print("Match doc1 (KYLE1):", col.matches_filter(mock_doc1, filter_query))
    print("Match doc2 (All Branches):", col.matches_filter(mock_doc2, filter_query))

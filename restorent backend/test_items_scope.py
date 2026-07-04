import sys
import os
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import app1

# Search the items collection for Item Code 0003 or Item Name 'Jumbo Prawns Burger'
items = app1.items_collection.find({'item_code': '0003'})
print("Found items:", len(items))
for item in items:
    print("Item:", {k: v for k, v in item.items() if k in ['item_name', 'item_code', 'branch_names', 'company_names', 'branch', 'company', 'branch_id']})

# Also try searching using the get_data_scope_filter logic for KYLE1(BR)
can_access, filter_query = app1.get_data_scope_filter('item_master', 'KYLE1', 'KYLE1(BR)', 'branch_manager')
print("Scope filter:", filter_query)

items_in_scope = app1.items_collection.find({'$and': [{'item_code': '0003'}, filter_query]})
print("Items in scope:", len(items_in_scope))


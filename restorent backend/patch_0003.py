import sys
import os
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import app1

# Fetch existing item
item = app1.items_collection.find_one({'item_code': '0003'})
if item:
    print("Found item:", item['_id'])
    
    # Force branch_names
    app1.items_collection.update_one({'_id': item['_id']}, {'$set': {'branch_names': ['KYLE1(BR)']}})
    
    # Verify update
    updated_item = app1.items_collection.find_one({'_id': item['_id']})
    print("Updated branch_names:", updated_item.get('branch_names'))
else:
    print("Item 0003 not found")

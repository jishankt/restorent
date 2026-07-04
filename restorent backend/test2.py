from pymongo import MongoClient
import json
client = MongoClient('mongodb://127.0.0.1:27017/')
db = client['restaurant_pos']
items = list(db.items_collection.find({'item_name': 'Mutton Burger'}))
for item in items:
    print({
        '_id': str(item.get('_id')),
        'global_ref_id': str(item.get('global_ref_id')),
        'branch_name': item.get('branch_name'),
        'company_name': item.get('company_name'),
        'branch_prices': item.get('branch_prices')
    })

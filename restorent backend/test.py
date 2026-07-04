from pymongo import MongoClient
import json
client = MongoClient('mongodb+srv://admin:admin@cluster0.hnhp9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['restaurant_pos']
items = list(db.items_collection.find({'item_name': 'Mutton Burger'}))
for item in items:
    print({
        '_id': str(item.get('_id')),
        'global_ref_id': str(item.get('global_ref_id')),
        'branch_name': item.get('branch_name'),
        'branch_names': item.get('branch_names'),
        'branch_prices': item.get('branch_prices')
    })

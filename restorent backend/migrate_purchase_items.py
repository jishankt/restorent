import os
from pymongo import MongoClient

mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(mongo_uri)
db = client['restaurant_pos']
collection = db['purchase_items']

items = collection.find({})
updated_count = 0

for item in items:
    update_data = {}
    
    # Map old names to new names
    if 'company' in item:
        update_data['brand'] = item['company']
        
    if 'name' in item:
        update_data['item_name'] = item['name']
        
    if 'boxToMaster' in item:
        update_data['packets_per_box'] = float(item['boxToMaster'])
        
    if 'masterToOuter' in item:
        update_data['units_per_packet'] = float(item['masterToOuter'])
        
    if 'outerToNos' in item:
        update_data['total_units_per_box'] = float(item['outerToNos'])

    if update_data:
        collection.update_one({'_id': item['_id']}, {'$set': update_data, '$unset': {
            'company': "",
            'name': "",
            'boxToMaster': "",
            'masterUnit': "",
            'masterToOuter': "",
            'outerUnit': "",
            'outerToNos': "",
            'nosUnit': ""
        }})
        updated_count += 1

print(f"Migration completed. Updated {updated_count} purchase items.")

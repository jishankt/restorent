import pymongo
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["restaurant_pos"]
items_collection = db["items"]
items = list(items_collection.find({}))
print(f"Total items in DB: {len(items)}")
for item in items:
    print(f"Name: {item.get('item_name')}, Company: {item.get('company_name')}")

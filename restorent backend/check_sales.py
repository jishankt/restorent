import json
from pymongo import MongoClient

client = MongoClient('mongodb+srv://manojkumard956:e6vU5PZJ1HjJ5s1N@cluster0.k2671.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['restaurant_pos']
sales_collection = db['sales']

print("Finding sales for company 'Kyle':")
for s in sales_collection.find({'company_name': 'Kyle'}, {'invoice_no': 1, 'branch_name': 1, 'branch': 1, 'company_name': 1, '_id': 0}):
    print(s)

import sys
sys.path.append('.')
from pymongo import MongoClient
client = MongoClient('mongodb+srv://tharun4b4:tharun2005@poscluster.u7n3p.mongodb.net/?retryWrites=true&w=majority&appName=POSCluster')
db = client['restaurant_pos']
users = list(db.users.find({'role': 'Tenant Admin'}))
for u in users:
    print('User: ' + str(u.get('email')) + ', Tenant ID: ' + str(u.get('tenant_id')) + ', Companies: ' + str(u.get('companies')))

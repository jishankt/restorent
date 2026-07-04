import sys
sys.path.append('.')
from pymongo import MongoClient
import json
client = MongoClient('mongodb+srv://tharun4b4:tharun2005@poscluster.u7n3p.mongodb.net/?retryWrites=true&w=majority&appName=POSCluster')
db = client['restaurant_pos']
c = db.companies.find_one({})
print(str(c))

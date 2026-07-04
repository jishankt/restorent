import os
import sys
import json
import logging
from bson import ObjectId
import re

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app1 import app, worker_collection, SQLiteCollection
import sqlite3

logging.basicConfig(level=logging.DEBUG)

# The EXACT filter query that get_data_scope_filter generates for BearerHead
filter_query = {
    '$and': [
        {'company_names': {'$in': ['companyone']}},
        {},
        {'$or': [
            {'_id': {'$in': ['b780f681-c22a-4bf1-92c8-e960fc1187c5']}},
            {'email': {'$in': ['nisam@gmail.com']}},
            {'userId': {'$in': ['b780f681-c22a-4bf1-92c8-e960fc1187c5', 'nisam@gmail.com', 'Nisam']}},
            {'username': {'$in': ['b780f681-c22a-4bf1-92c8-e960fc1187c5', 'nisam@gmail.com', 'Nisam']}}
        ]}
    ]
}

print("Running worker_collection.find() with filter:")
print(json.dumps(filter_query, indent=2))

all_emps = list(worker_collection.find(filter_query))
print("Total found:", len(all_emps))
for emp in all_emps:
    print(emp.get('name'))

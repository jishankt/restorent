import sqlite3
import json
import re
import ast

class SQLiteCollection:
    def __init__(self, conn, name):
        self.conn = conn
        self.name = name

    def find(self, filter_=None):
        c = self.conn.cursor()
        c.execute(f"SELECT data FROM {self.name}")
        results = []
        for row in c.fetchall():
            try:
                d = json.loads(row[0])
                if self.matches_filter(d, filter_):
                    results.append(d)
            except Exception as e:
                pass
        return results

    def matches_filter(self, d, filter_):
        if not filter_:
            return True
        for key, value in filter_.items():
            if key == '$or':
                if not any(self.matches_filter(d, subfilter) for subfilter in value):
                    return False
            elif key == '$and':
                if not all(self.matches_filter(d, subfilter) for subfilter in value):
                    return False
            else:
                doc_val = d.get(key)
                if isinstance(value, dict):
                    if '$in' in value:
                        target_list = value['$in']
                        if not isinstance(target_list, list): target_list = [target_list]
                        target_norms = {str(v).lower().strip() for v in target_list if v is not None}
                        def flatten_and_norm(val):
                            results = set()
                            if isinstance(val, list):
                                for v in val: results.update(flatten_and_norm(v))
                            elif isinstance(val, str):
                                val = val.strip()
                                if val.startswith('[') and val.endswith(']'):
                                    try:
                                        parsed = ast.literal_eval(val)
                                        results.update(flatten_and_norm(parsed))
                                    except: results.add(val.lower().strip())
                                else:
                                    for part in val.split(','): results.add(part.lower().strip())
                            elif val is not None:
                                results.add(str(val).lower().strip())
                            return results
                        doc_norms = flatten_and_norm(doc_val)
                        if not (doc_norms & target_norms):
                            return False
                    # ... simplified mock just for $in
                elif doc_val != value:
                    return False
        return True

conn = sqlite3.connect('restaurant.db')
worker_collection = SQLiteCollection(conn, 'new_employee')

filter_query = {
    '$and': [
        {'company_names': {'$in': ['companyone']}},
        {},
        {'$or': [
            {'_id': {'$in': ['b780f681-c22a-4bf1-92c8-e960fc1187c5']}},
            {'email': {'$in': ['nisam@gmail.com']}}
        ]}
    ]
}

all_emps = list(worker_collection.find(filter_query))
print("Total found:", len(all_emps))
for emp in all_emps:
    print(emp.get('name'))

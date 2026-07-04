import sqlite3
import json
import re

class SQLiteCollection:
    def __init__(self, conn, name):
        self.conn = conn
        self.name = name

    def find_one(self, filter_=None):
        c = self.conn.cursor()
        c.execute(f"SELECT data FROM {self.name}")
        for row in c.fetchall():
            try:
                d = json.loads(row[0])
                if self.matches_filter(d, filter_):
                    return d
            except Exception:
                pass
        return None

    def matches_filter(self, d, filter_):
        if not filter_: return True
        for key, value in filter_.items():
            doc_val = d.get(key)
            if isinstance(value, dict) and '$regex' in value:
                flags = 0
                if value.get('$options') == 'i': flags = re.IGNORECASE
                if not re.search(value['$regex'], str(doc_val or '').strip(), flags):
                    return False
            elif doc_val != value:
                return False
        return True

conn = sqlite3.connect('restaurant.db')
role_permissions_collection = SQLiteCollection(conn, 'role_permissions')

role_regex = {'$regex': '^BearerHead$', '$options': 'i'}
print(role_permissions_collection.find_one({'role': role_regex}))
print(role_permissions_collection.find_one({'role': role_regex, 'company': 'companyone'}))

from app1 import SQLiteCollection
coll = SQLiteCollection(None, 'test')
filter_ = {'$or': [{'branch_name': 'KYLE1(BR)', 'company_name': 'KYLE1'}, {'branch': 'KYLE1(BR)', 'company': 'KYLE1'}]}
d = {'branch': 'KYLE1(BR)', 'company': 'KYLE1', 'branch_name': 'KYLE1(BR)'}
print("Match result:", coll.matches_filter(d, filter_))

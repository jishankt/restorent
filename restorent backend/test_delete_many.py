from app1 import SQLiteCollection, conn
import json

coll = SQLiteCollection(conn, 'test_delete_many')
conn.execute('CREATE TABLE IF NOT EXISTS test_delete_many (id TEXT PRIMARY KEY, data TEXT)')
conn.execute('DELETE FROM test_delete_many')
conn.execute('INSERT INTO test_delete_many VALUES (?, ?)', ('1', json.dumps({'branch': 'KYLE1(BR)', 'company': 'KYLE1'})))
conn.commit()

filter_ = {'$or': [{'branch_name': 'KYLE1(BR)', 'company_name': 'KYLE1'}, {'branch': 'KYLE1(BR)', 'company': 'KYLE1'}]}
res = coll.delete_many(filter_)

count = conn.execute('SELECT COUNT(*) FROM test_delete_many').fetchone()[0]
print(f'Deleted: {res.deleted_count}, Remaining: {count}')

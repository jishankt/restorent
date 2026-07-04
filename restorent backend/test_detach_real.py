import json
from app1 import SQLiteCollection, conn

coll = SQLiteCollection(conn, 'test_detach')

# Insert dummy data
coll.conn.execute("DROP TABLE IF EXISTS test_detach")
coll.conn.execute("CREATE TABLE test_detach (id TEXT, data TEXT)")
doc = {"group_name": "Food", "created_at": "2026-03-17T08:22:18.472840+00:00", "_id": "db4175f9-d7fd-44fd-9e80-c677c4600d4f", "company": "KYLE1", "branch": "KYLE1(BR)", "company_name": "KYLE1", "company_names": ["KYLE1"], "tenant_id": "42b66335-ab26-4574-9a3b-a7e06bf195ba", "company_id": "27746a2e-b463-4e68-a368-8425fcc4fd1b", "tenant_name": None, "branch_name": "KYLE1(BR)", "branch_names": ["KYLE1(BR)"], "branch_id": "2ea75bb0-0008-431a-b523-2bf5b411091e", "createdBy": "super-admin-001"}
coll.conn.execute("INSERT INTO test_detach (id, data) VALUES (?, ?)", (doc['_id'], json.dumps(doc)))
coll.conn.commit()

delete_query = {"$or": [{"branch_id": "2ea75bb0-0008-431a-b523-2bf5b411091e"}, {"branch_name": "KYLE1(BR)", "company_name": "KYLE1"}, {"branch": "KYLE1(BR)", "company": "KYLE1"}]}

update_payload = {
    "$set": {
        "branch_id": "", "branch": "", "branch_name": ""
    },
    "$pull": {"branch_names": "KYLE1(BR)"}
}

coll.update_many(delete_query, update_payload)

rows = coll.conn.execute("SELECT data FROM test_detach").fetchall()
print(rows[0][0])

from app1 import SQLiteCollection, conn
import json

coll = SQLiteCollection(conn, 'test_delete_many')

doc = {"group_name": "Food", "created_at": "2026-03-17T08:22:18.472840+00:00", "_id": "db4175f9-d7fd-44fd-9e80-c677c4600d4f", "company": "KYLE1", "branch": "KYLE1(BR)", "company_name": "KYLE1", "company_names": ["KYLE1"], "tenant_id": "42b66335-ab26-4574-9a3b-a7e06bf195ba", "company_id": "27746a2e-b463-4e68-a368-8425fcc4fd1b", "tenant_name": None, "branch_name": "KYLE1(BR)", "branch_names": ["KYLE1(BR)"], "branch_id": "2ea75bb0-0008-431a-b523-2bf5b411091e", "createdBy": "super-admin-001"}

delete_query = {"$or": [{"branch_id": "2ea75bb0-0008-431a-b523-2bf5b411091e"}, {"branch_name": "KYLE1(BR)", "company_name": "KYLE1"}, {"branch": "KYLE1(BR)", "company": "KYLE1"}]}

print("Matches:", coll.matches_filter(doc, delete_query))

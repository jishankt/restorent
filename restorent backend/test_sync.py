import sqlite3, json, re
from app1 import extreme_norm

# Simulate inputs
sync_branch = 'test2' # User is in test2
managed_companies = ['company', 'companyone', 'companytwo'] # Group Admin has all companies

# Logic from app1.py
company_variants = []
for c in managed_companies:
    if c:
        company_variants += [c, c.lower(), c.upper(), c.capitalize(), extreme_norm(c)]
company_variants = list(set(company_variants))

company_clause = {'$or': [
    {'company_name': {'$in': company_variants}},
    {'company': {'$in': company_variants}},
    {'$and': [
        {'$or': [{'company_name': {'$exists': False}}, {'company_name': {'$in': [None, '', 'All', 'all', 'ALL', 'Global', 'global']}}]},
        {'$or': [{'company': {'$exists': False}}, {'company': {'$in': [None, '', 'All', 'all', 'ALL', 'Global', 'global']}}]}
    ]}
]}

if sync_branch and sync_branch.lower() not in ['all', 'all branches', 'any']:
    branch_exclude = {'$nor': [
        {'branch_name': {'$regex': f'(^|,){re.escape(sync_branch)}(,|$)', '$options': 'i'}},
        {'branch': {'$regex': f'(^|,){re.escape(sync_branch)}(,|$)', '$options': 'i'}},
    ]}
else:
    branch_exclude = {}

clauses = [c for c in [company_clause, branch_exclude] if c]
sync_filter = {'$and': clauses} if len(clauses) > 1 else (clauses[0] if clauses else {})

print(json.dumps(sync_filter, indent=2))

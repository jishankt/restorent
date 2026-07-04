import re

def extreme_norm(val):
    if not val: return ""
    return str(val).strip().lower().replace(" ", "").replace("_", "").replace("-", "")

def build_tenancy_filter(field_name_long, field_name_short, aliases, include_empty=False):
    alias_list = list(aliases)
    clauses = []
    # Simplified version of the complex build_tenancy_filter logic for simulation
    for alias in alias_list:
        if not alias: continue
        pattern = f"(^|['\"\\s,\\[]){re.escape(str(alias))}(['\"\\s,\\]]|$)"
        clauses.append({field_name_long: alias})
        clauses.append({field_name_short: alias})
        # Plural fields
        clauses.append({field_name_long + "s": alias})
    
    if include_empty:
        clauses.append({field_name_long: None})
        clauses.append({field_name_short: None})
        
    return clauses # Return list of options to check manually

# Simulation for KyleSolution / Kyle1
company_aliases = {'KyleSolution', 'kylesolution', 'Kyle Solution'}
branch_aliases = {'Kyle1', 'kyle1'}

import sqlite3
import json

db_path = 'c:/manoj/webrestaurant/backend/restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    print("--- Simulating Query for KyleSolution / Kyle1 ---")
    rows = cur.execute("SELECT data FROM items").fetchall()
    matched = 0
    for row in rows:
        data = json.loads(row[0])
        comp = data.get('company_name') or data.get('company')
        branch = data.get('branch_name') or data.get('branch')
        
        # Simple match simulation
        comp_match = comp in company_aliases or (not comp and True) # Simplified include_empty
        branch_match = branch in branch_aliases or branch in ['all', 'All', None, '']
        
        if comp_match and branch_match:
            matched += 1
            if matched < 5:
                print(f"Match: {comp} | {branch}")
    
    print(f"Total matched: {matched}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()

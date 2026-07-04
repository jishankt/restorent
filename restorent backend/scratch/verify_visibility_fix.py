import sqlite3
import json
import re

# Mocking the normalization and regex logic from app1.py
def extreme_norm(s):
    if not s: return ""
    return str(s).strip() # Simpler version for test

def matches_filter(doc, filter_query):
    for key, value in filter_query.items():
        if key == '$or':
            if not any(matches_filter(doc, sub) for sub in value):
                return False
        elif key == '$and':
            if not all(matches_filter(doc, sub) for sub in value):
                return False
        else:
            doc_val = doc.get(key)
            if isinstance(value, dict):
                if '$regex' in value:
                    regex = value['$regex']
                    flags = re.IGNORECASE if value.get('$options') == 'i' else 0
                    if isinstance(doc_val, list):
                        if not any(re.search(regex, str(v), flags) for v in doc_val):
                            return False
                    else:
                        if not re.search(regex, str(doc_val), flags):
                            return False
                elif '$in' in value:
                    target = [str(t).lower() for t in value['$in']]
                    if isinstance(doc_val, list):
                        doc_norms = [str(v).lower() for v in doc_val]
                    else:
                        doc_norms = [str(doc_val).lower()]
                    if not any(v in target for v in doc_norms):
                        return False
            else:
                if doc_val != value:
                    return False
    return True

conn = sqlite3.connect('restaurant.db')
cursor = conn.cursor()
cursor.execute("SELECT data FROM purchase_items")
doc = json.loads(cursor.fetchone()[0])

# Current user: KyleSolution
company_aliases = ['KyleSolution', 'kylesolution']

# The NEW filter logic from get_data_scope_filter
company_filter = {'company': {'$in': company_aliases}} # simplified
supplier_regex = "|".join([re.escape(a) for a in company_aliases])
supplier_visibility_query = {'suppliers': {'$regex': supplier_regex, '$options': 'i'}}

final_filter = {'$or': [company_filter, supplier_visibility_query]}

print("Item Data:")
print(json.dumps(doc, indent=2))
print("\nFilter Query:")
print(json.dumps(final_filter, indent=2))

result = matches_filter(doc, final_filter)
print(f"\nDoes item match filter? {result}")

conn.close()

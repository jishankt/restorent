import json
import uuid

# Mocking the environment
class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = {}
        self.deleted = []
        self.updates = []

    def find_one(self, filter):
        for d in self.data.values():
            if all(d.get(k) == v for k, v in filter.items() if k != '_id'):
                return d
        return None

    def find(self, filter):
        return [d for d in self.data.values()]

    def delete_one(self, query):
        self.deleted.append(query)

    def update_one(self, filter, update):
        self.updates.append((filter, update))

def ensure_list(val):
    if isinstance(val, list): return val
    if not val: return []
    return [val]

# The logic to test
def get_all_active_companies():
    return ["KyleSolution", "companyone", "companytwo"]

def perform_tenant_aware_delete(collection, query, active_company, record, sync_user=False, active_branch=None):
    try:
        company_names = ensure_list(record.get('company_names') or record.get('companies') or record.get('company_name') or record.get('company'))
        normalized_comps = [str(c).lower().strip() for c in company_names]
        
        branch_names = ensure_list(record.get('branch_names') or record.get('branches') or record.get('branch_name') or record.get('branch'))
        normalized_branches = [str(b).lower().strip() for b in branch_names]
        
        is_global_comp = "all" in normalized_comps
        is_global_branch = "all" in normalized_branches
        
        active_comp_norm = str(active_company).lower().strip() if active_company else None
        active_branch_norm = str(active_branch).lower().strip() if active_branch else None

        if (not active_company or active_comp_norm == 'all') and (not active_branch or active_branch_norm == 'all'):
             collection.delete_one(query)
             return False, "Record permanently deleted from system."

        if active_comp_norm and active_comp_norm != "all":
            if is_global_comp:
                all_comps = get_all_active_companies()
                remaining = [c for c in all_comps if str(c).lower().strip() != active_comp_norm]
                update_set = {"company_names": remaining, "companies": remaining}
                if remaining:
                    update_set["company_name"] = remaining[0]
                    update_set["company"] = remaining[0]
                else:
                    collection.delete_one(query)
                    return False, "Record deleted (no other companies available)."
                
                collection.update_one({"_id": record["_id"]}, {"$set": update_set})
                return True, f"Record removed from {active_company}. Association preserved for other {len(remaining)} companies."
            
            elif len(company_names) > 1:
                pull_op = {"$pull": {"company_names": active_company, "companies": active_company, "company_name": active_company, "company": active_company}}
                collection.update_one({"_id": record["_id"]}, pull_op)
                return True, f"Association removed for {active_company}."

        collection.delete_one(query)
        return False, "Record permanently deleted."
    except Exception as e:
        return None, str(e)

# Test Cases
coll = MockCollection("test")

print("--- Case 1: Global Record ('All') deletion in KyleSolution ---")
record1 = {"_id": "1", "company_names": ["all"]}
is_partial, msg = perform_tenant_aware_delete(coll, {"_id": "1"}, "KyleSolution", record1)
print(f"Result: is_partial={is_partial}, msg={msg}")
if coll.updates:
    print(f"Updates attempt: {coll.updates[-1]}")

print("\n--- Case 2: Shared Record ['A', 'B'] deletion in A ---")
record2 = {"_id": "2", "company_names": ["A", "B"]}
is_partial, msg = perform_tenant_aware_delete(coll, {"_id": "2"}, "A", record2)
print(f"Result: is_partial={is_partial}, msg={msg}")
if coll.updates:
    print(f"Updates attempt: {coll.updates[-1]}")

print("\n--- Case 3: Hard Delete by Group Admin ('All' scope) ---")
record3 = {"_id": "3", "company_names": ["all"]}
is_partial, msg = perform_tenant_aware_delete(coll, {"_id": "3"}, "all", record3)
print(f"Result: is_partial={is_partial}, msg={msg}")
print(f"Deleted queries: {coll.deleted}")

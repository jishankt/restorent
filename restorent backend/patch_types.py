import os
import uuid
import re

app_file = r'C:\manoj\backend\app1.py'
with open(app_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update POST /api/employee-types to use V3 logic and global_ref_id
old_post = """            for comp_name in company_names:
                ids = _resolve_tenant_company_branch(comp_name)
                
                if branch_names:
                    for br_name in branch_names:
                        br_ids = _resolve_tenant_company_branch(comp_name, br_name)
                        
                        dup_q = {"name": {"$regex": f"^{str(name).strip()}$", "$options": "i"},
                                 "company_id": br_ids.get("company_id"),
                                 "branch_id": br_ids.get("branch_id")}
                        if employee_type_collection.find_one(dup_q):
                            continue # Skip duplicate silently

                        doc = {
                            "_id": str(__import__('uuid').uuid4()),
                            "tenant_id": br_ids.get("tenant_id"),
                            "company_id": br_ids.get("company_id"),
                            "company_name": comp_name,
                            "branch_id": br_ids.get("branch_id"),
                            "branch_name": br_name,
                            "name": name.strip(),
                            "description": description,
                            "salaryRange": salary_range,
                            "designation": designation,
                            "reportTo": report_to,
                            "grade": grade,
                            "created_at": created_at
                        }
                        employee_type_collection.insert_one(doc)
                        created_docs.append(doc)
                else:
                    dup_q = {"name": {"$regex": f"^{str(name).strip()}$", "$options": "i"},
                             "company_id": ids.get("company_id")}
                    if employee_type_collection.find_one(dup_q):
                        continue
                        
                    doc = {
                        "_id": str(__import__('uuid').uuid4()),
                        "tenant_id": ids.get("tenant_id"),
                        "company_id": ids.get("company_id"),
                        "company_name": comp_name,
                        "name": name.strip(),
                        "description": description,
                        "salaryRange": salary_range,
                        "designation": designation,
                        "reportTo": report_to,
                        "grade": grade,
                        "created_at": created_at
                    }
                    employee_type_collection.insert_one(doc)
                    created_docs.append(doc)"""

new_post = """            global_ref_id = str(__import__('uuid').uuid4())
            
            for comp_name in company_names:
                ids = _resolve_tenant_company_branch(comp_name)
                if not ids.get("company_id"): continue
                
                # ALWAYS create the "All Branches" base record
                doc_all = {
                    "_id": str(__import__('uuid').uuid4()),
                    "global_ref_id": global_ref_id,
                    "tenant_id": ids.get("tenant_id"),
                    "company_id": ids.get("company_id"),
                    "company_name": comp_name,
                    "branch_id": None,
                    "branch_name": "All Branches",
                    "name": name.strip(),
                    "description": description,
                    "salaryRange": salary_range,
                    "designation": designation,
                    "reportTo": report_to,
                    "grade": grade,
                    "created_at": created_at
                }
                employee_type_collection.insert_one(doc_all)
                created_docs.append(doc_all)
                
                # Add specific branch records
                if branch_names:
                    for br_name in branch_names:
                        br_ids = _resolve_tenant_company_branch(comp_name, br_name)
                        if not br_ids.get("branch_id"): continue
                        
                        doc_br = {
                            "_id": str(__import__('uuid').uuid4()),
                            "global_ref_id": global_ref_id,
                            "tenant_id": br_ids.get("tenant_id"),
                            "company_id": br_ids.get("company_id"),
                            "company_name": comp_name,
                            "branch_id": br_ids.get("branch_id"),
                            "branch_name": br_name,
                            "name": name.strip(),
                            "description": description,
                            "salaryRange": salary_range,
                            "designation": designation,
                            "reportTo": report_to,
                            "grade": grade,
                            "created_at": created_at
                        }
                        employee_type_collection.insert_one(doc_br)
                        created_docs.append(doc_br)"""

if old_post in content:
    content = content.replace(old_post, new_post)
    print("Patched employee_types POST")
else:
    print("WARNING: employee_types POST not found")

# 2. Add bulk PUT and DELETE for employee types
bulk_endpoints = """
@app.route('/api/employee-types/bulk/<global_ref_id>', methods=['PUT'])
@db_required
def bulk_update_employee_type(global_ref_id):
    try:
        data = request.get_json()
        can_access, data_scope_filter = get_data_scope_filter('employee_types')
        if not can_access: return jsonify({"error": "Access denied"}), 403

        name = (data.get('name') or '').strip()
        exclude_keys = {'name', 'company_name', 'branch_name', 'company_names', 'branch_names', '_id', 'global_ref_id'}
        update_data = {k: v for k, v in data.items() if k not in exclude_keys}
        if name: update_data['name'] = name
        
        from datetime import datetime
        try:
            from zoneinfo import ZoneInfo
            update_data['modified_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
        except: pass

        ctx = _get_tenant_context_for_update_delete()
        update_filter = {"$and": [data_scope_filter, _build_strict_bulk_filter(global_ref_id, ctx)]}
        
        # --- SYNCHRONIZATION LOGIC FOR ADDED/REMOVED BRANCHES ---
        company_names = data.get('company_names', [])
        branch_names = data.get('branch_names', [])
        if branch_names:
            branch_names = [b for b in branch_names if b and str(b).lower() not in ['all', 'all branches', 'global', 'all companies']]
            
        if company_names:
            existing_records = list(employee_type_collection.find(update_filter))
            if existing_records:
                desired_combinations = set()
                for comp_name in company_names:
                    desired_combinations.add((comp_name, "All Branches"))
                    if branch_names:
                        for br_name in branch_names:
                            br_ids = _resolve_tenant_company_branch(comp_name, br_name)
                            if br_ids.get("branch_id"):
                                desired_combinations.add((comp_name, br_name))
                                
                existing_combinations = {(r.get('company_name'), r.get('branch_name')) for r in existing_records}
                
                combinations_to_add = desired_combinations - existing_combinations
                combinations_to_remove = existing_combinations - desired_combinations
                
                import uuid
                if combinations_to_add:
                    base_record = existing_records[0].copy()
                    for k in ['_id', 'company_name', 'company_id', 'branch_name', 'branch_id', 'tenant_id']:
                        base_record.pop(k, None)
                    base_record.update(update_data)
                    
                    for comp_name, br_name in combinations_to_add:
                        ids = _resolve_tenant_company_branch(comp_name)
                        if not ids.get("company_id"): continue
                        
                        br_id = None
                        if br_name != "All Branches":
                            br_ids = _resolve_tenant_company_branch(comp_name, br_name)
                            if not br_ids.get("branch_id"): continue
                            br_id = br_ids.get("branch_id")
                            tenant_id = br_ids.get("tenant_id")
                        else:
                            tenant_id = ids.get("tenant_id")
                            
                        new_doc = {
                            "_id": str(uuid.uuid4()),
                            "global_ref_id": global_ref_id,
                            "tenant_id": tenant_id,
                            "company_id": ids.get("company_id"),
                            "company_name": comp_name,
                            "branch_id": br_id,
                            "branch_name": br_name,
                            **base_record
                        }
                        employee_type_collection.insert_one(new_doc)
                        
                if combinations_to_remove:
                    for comp_name, br_name in combinations_to_remove:
                        employee_type_collection.delete_one({"$and": [
                            update_filter, 
                            {"company_name": comp_name, "branch_name": br_name}
                        ]})
        # --- END SYNCHRONIZATION LOGIC ---
        
        result = employee_type_collection.update_many(update_filter, {'$set': update_data})
        if result.matched_count == 0: return jsonify({"error": "No linked types found or access denied"}), 404
        return jsonify({"message": f"{result.modified_count} linked types updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/employee-types/bulk/<global_ref_id>', methods=['DELETE'])
@db_required
def bulk_delete_employee_type(global_ref_id):
    try:
        can_access, data_scope_filter = get_data_scope_filter('employee_types')
        if not can_access: return jsonify({"error": "Access denied"}), 403

        ctx = _get_tenant_context_for_update_delete()
        delete_filter = {"$and": [data_scope_filter, _build_strict_bulk_filter(global_ref_id, ctx)]}
        
        result = employee_type_collection.delete_many(delete_filter)
        if result.deleted_count == 0: return jsonify({"error": "No linked types found or access denied"}), 404
        return jsonify({"message": f"{result.deleted_count} linked types deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
"""

if "def bulk_update_employee_type" not in content:
    target = "@app.route('/api/employee-types/<type_id>', methods=['PUT', 'DELETE'])"
    if target in content:
        content = content.replace(target, bulk_endpoints + "\n" + target)
        print("Added bulk endpoints")
    else:
        print("WARNING: Could not find target to insert bulk endpoints")

with open(app_file, 'w', encoding='utf-8') as f:
    f.write(content)

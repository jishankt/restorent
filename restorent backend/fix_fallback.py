import re

def fix_all(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    patterns = [
        # departments
        ("departments", r'''(                        "branch_name": br_name,\s*
                        "department_name": dept_name,\s*
                        "name": dept_name,\s*
                        "is_active": is_active,\s*
                        "description": description,\s*
                        "created_at": created_at\s*
                    \}\s*
                    departments_collection\.insert_one\(doc\)\s*
                    created_docs\.append\(doc\)\s*
                    branch_assigned_for_company = True\s*)
            else:\s*
                doc = \{\s*
                    "_id": str\(__import__\('uuid'\)\.uuid4\(\)\),\s*
                    "global_ref_id": global_ref_id,\s*
                    "tenant_id": ids\.get\("tenant_id"\),\s*
                    "company_id": ids\.get\("company_id"\),\s*
                    "company_name": comp_name,\s*
                    "branch_id": None,\s*
                    "branch_name": "All Branches",\s*
                    "department_name": dept_name,\s*
                    "name": dept_name,\s*
                    "is_active": is_active,\s*
                    "description": description,\s*
                    "created_at": created_at\s*
                \}\s*
                departments_collection\.insert_one\(doc\)\s*
                created_docs\.append\(doc\)''',
         r'''\1
            
            if not branch_assigned_for_company:
                doc = {
                    "_id": str(__import__('uuid').uuid4()),
                    "global_ref_id": global_ref_id,
                    "tenant_id": ids.get("tenant_id"),
                    "company_id": ids.get("company_id"),
                    "company_name": comp_name,
                    "branch_id": None,
                    "branch_name": "All Branches",
                    "department_name": dept_name,
                    "name": dept_name,
                    "is_active": is_active,
                    "description": description,
                    "created_at": created_at
                }
                departments_collection.insert_one(doc)
                created_docs.append(doc)'''),

        # kitchens
        ("kitchens", r'''(                        "branch_name": br_name,\s*
                        "kitchen_name": kitchen_name,\s*
                        "name": kitchen_name,\s*
                        "is_active": is_active,\s*
                        "description": description,\s*
                        "created_at": created_at,\s*
                        "company": comp_name,\s*
                        "branch": br_name,\s*
                        "company_names": company_names,\s*
                        "branch_names": branch_names\s*
                    \}\s*
                    kitchens_collection\.insert_one\(doc\)\s*
                    created_docs\.append\(doc\)\s*
                    branch_assigned_for_company = True\s*)
            else:\s*
                doc = \{\s*
                    "_id": str\(uuid\.uuid4\(\)\),\s*
                    "global_ref_id": global_ref_id,\s*
                    "tenant_id": ids\.get\("tenant_id"\),\s*
                    "company_id": ids\.get\("company_id"\),\s*
                    "company_name": comp_name,\s*
                    "branch_id": None,\s*
                    "branch_name": "All Branches",\s*
                    "kitchen_name": kitchen_name,\s*
                    "name": kitchen_name,\s*
                    "is_active": is_active,\s*
                    "description": description,\s*
                    "created_at": created_at,\s*
                    "company": comp_name,\s*
                    "branch": "All Branches",\s*
                    "company_names": company_names,\s*
                    "branch_names": branch_names if branch_names else \["All Branches"\]\s*
                \}\s*
                kitchens_collection\.insert_one\(doc\)\s*
                created_docs\.append\(doc\)''',
         r'''\1
            
            if not branch_assigned_for_company:
                doc = {
                    "_id": str(uuid.uuid4()),
                    "global_ref_id": global_ref_id,
                    "tenant_id": ids.get("tenant_id"),
                    "company_id": ids.get("company_id"),
                    "company_name": comp_name,
                    "branch_id": None,
                    "branch_name": "All Branches",
                    "kitchen_name": kitchen_name,
                    "name": kitchen_name,
                    "is_active": is_active,
                    "description": description,
                    "created_at": created_at,
                    "company": comp_name,
                    "branch": "All Branches",
                    "company_names": company_names,
                    "branch_names": branch_names if branch_names else ["All Branches"]
                }
                kitchens_collection.insert_one(doc)
                created_docs.append(doc)'''),

        # employee_types
        ("employee_types", r'''(                        "branch_name": br_name,\s*
                        "type_name": type_name,\s*
                        "is_active": is_active,\s*
                        "description": description,\s*
                        "created_at": created_at,\s*
                        \*\*extra_fields\s*
                    \}\s*
                    employeetypes_collection\.insert_one\(doc\)\s*
                    created_docs\.append\(doc\)\s*
                    branch_assigned_for_company = True\s*)
            else:\s*
                doc = \{\s*
                    "_id": str\(uuid\.uuid4\(\)\),\s*
                    "global_ref_id": global_ref_id,\s*
                    "tenant_id": ids\.get\("tenant_id"\),\s*
                    "company_id": ids\.get\("company_id"\),\s*
                    "company_name": comp_name,\s*
                    "branch_id": None,\s*
                    "branch_name": "All Branches",\s*
                    "type_name": type_name,\s*
                    "is_active": is_active,\s*
                    "description": description,\s*
                    "created_at": created_at,\s*
                    \*\*extra_fields\s*
                \}\s*
                employeetypes_collection\.insert_one\(doc\)\s*
                created_docs\.append\(doc\)''',
         r'''\1
            
            if not branch_assigned_for_company:
                doc = {
                    "_id": str(uuid.uuid4()),
                    "global_ref_id": global_ref_id,
                    "tenant_id": ids.get("tenant_id"),
                    "company_id": ids.get("company_id"),
                    "company_name": comp_name,
                    "branch_id": None,
                    "branch_name": "All Branches",
                    "type_name": type_name,
                    "is_active": is_active,
                    "description": description,
                    "created_at": created_at,
                    **extra_fields
                }
                employeetypes_collection.insert_one(doc)
                created_docs.append(doc)'''),

        # employee_designations
        ("employee_designations", r'''(                        "branch_name": br_name,\s*
                        "designation_name": designation_name,\s*
                        "is_active": is_active,\s*
                        "description": description,\s*
                        "created_at": created_at,\s*
                        \*\*extra_fields\s*
                    \}\s*
                    employeedesignations_collection\.insert_one\(doc\)\s*
                    created_docs\.append\(doc\)\s*
                    branch_assigned_for_company = True\s*)
            else:\s*
                doc = \{\s*
                    "_id": str\(uuid\.uuid4\(\)\),\s*
                    "global_ref_id": global_ref_id,\s*
                    "tenant_id": ids\.get\("tenant_id"\),\s*
                    "company_id": ids\.get\("company_id"\),\s*
                    "company_name": comp_name,\s*
                    "branch_id": None,\s*
                    "branch_name": "All Branches",\s*
                    "designation_name": designation_name,\s*
                    "is_active": is_active,\s*
                    "description": description,\s*
                    "created_at": created_at,\s*
                    \*\*extra_fields\s*
                \}\s*
                employeedesignations_collection\.insert_one\(doc\)\s*
                created_docs\.append\(doc\)''',
         r'''\1
            
            if not branch_assigned_for_company:
                doc = {
                    "_id": str(uuid.uuid4()),
                    "global_ref_id": global_ref_id,
                    "tenant_id": ids.get("tenant_id"),
                    "company_id": ids.get("company_id"),
                    "company_name": comp_name,
                    "branch_id": None,
                    "branch_name": "All Branches",
                    "designation_name": designation_name,
                    "is_active": is_active,
                    "description": description,
                    "created_at": created_at,
                    **extra_fields
                }
                employeedesignations_collection.insert_one(doc)
                created_docs.append(doc)'''),

        # item_groups
        ("item_groups", r'''(                        "branch_name": br_name,\s*
                        "group_name": group_name,\s*
                        "created_at": created_at,\s*
                        "company": comp_name,\s*
                        "branch": br_name,\s*
                        "company_names": company_names,\s*
                        "branch_names": branch_names,\s*
                        \*\*extra_fields\s*
                    \}\s*
                    item_groups_collection\.insert_one\(doc\)\s*
                    created_docs\.append\(doc\)\s*
                    branch_assigned_for_company = True\s*)
            else:\s*
                doc = \{\s*
                    "_id": str\(uuid\.uuid4\(\)\),\s*
                    "global_ref_id": global_ref_id,\s*
                    "tenant_id": ids\.get\("tenant_id"\),\s*
                    "company_id": ids\.get\("company_id"\),\s*
                    "company_name": comp_name,\s*
                    "branch_id": None,\s*
                    "branch_name": "All Branches",\s*
                    "group_name": group_name,\s*
                    "created_at": created_at,\s*
                    "company": comp_name,\s*
                    "branch": "All Branches",\s*
                    "company_names": company_names,\s*
                    "branch_names": branch_names if branch_names else \["All Branches"\],\s*
                    \*\*extra_fields\s*
                \}\s*
                item_groups_collection\.insert_one\(doc\)\s*
                created_docs\.append\(doc\)''',
         r'''\1
            
            if not branch_assigned_for_company:
                doc = {
                    "_id": str(uuid.uuid4()),
                    "global_ref_id": global_ref_id,
                    "tenant_id": ids.get("tenant_id"),
                    "company_id": ids.get("company_id"),
                    "company_name": comp_name,
                    "branch_id": None,
                    "branch_name": "All Branches",
                    "group_name": group_name,
                    "created_at": created_at,
                    "company": comp_name,
                    "branch": "All Branches",
                    "company_names": company_names,
                    "branch_names": branch_names if branch_names else ["All Branches"],
                    **extra_fields
                }
                item_groups_collection.insert_one(doc)
                created_docs.append(doc)'''),

        # combo_offers
        ("combo_offers", r'''(                        "branch_name": br_name,\s*
                        "company": comp_name,\s*
                        "branch": br_name,\s*
                        "company_names": company_names,\s*
                        "branch_names": branch_names,\s*
                        \*\*extra_fields\s*
                    \}\s*
                    combo_offers_collection\.insert_one\(doc\)\s*
                    created_docs\.append\(doc\)\s*
                    branch_assigned_for_company = True\s*)
            else:\s*
                doc = \{\s*
                    "_id": str\(uuid\.uuid4\(\)\),\s*
                    "global_ref_id": global_ref_id,\s*
                    "tenant_id": ids\.get\("tenant_id"\),\s*
                    "company_id": ids\.get\("company_id"\),\s*
                    "company_name": comp_name,\s*
                    "branch_id": None,\s*
                    "branch_name": "All Branches",\s*
                    "company": comp_name,\s*
                    "branch": "All Branches",\s*
                    "company_names": company_names,\s*
                    "branch_names": branch_names if branch_names else \["All Branches"\],\s*
                    \*\*extra_fields\s*
                \}\s*
                combo_offers_collection\.insert_one\(doc\)\s*
                created_docs\.append\(doc\)''',
         r'''\1
            
            if not branch_assigned_for_company:
                doc = {
                    "_id": str(uuid.uuid4()),
                    "global_ref_id": global_ref_id,
                    "tenant_id": ids.get("tenant_id"),
                    "company_id": ids.get("company_id"),
                    "company_name": comp_name,
                    "branch_id": None,
                    "branch_name": "All Branches",
                    "company": comp_name,
                    "branch": "All Branches",
                    "company_names": company_names,
                    "branch_names": branch_names if branch_names else ["All Branches"],
                    **extra_fields
                }
                combo_offers_collection.insert_one(doc)
                created_docs.append(doc)''')
    ]

    for name, pat, rep in patterns:
        content, n = re.subn(pat, rep, content, flags=re.MULTILINE | re.DOTALL)
        print(f"{name}: {n} replacements")

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_all(r'c:\manoj\backend\restaurant-pos-backend\app1.py')

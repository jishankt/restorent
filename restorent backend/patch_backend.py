import re

with open(r'c:\manoj\backend\app1.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Patch /api/departments duplicate check
dept_old = '''        active_branch = request.headers.get('X-Branch-Name') or data.get('branch_name')
        active_company = request.headers.get('X-Company-Name') or data.get('company_name')

        # Check duplicate within context (Case-Insensitive)
        # NORMALIZATION: Handle typo context matching
        target_comp = str(active_company).strip() if active_company else ""
        comp_match = {"$regex": f"^{target_comp}$", "$options": "i"}
        
        dup_filter = {"name": {"$regex": f"^{str(data['name']).strip()}$", "$options": "i"}}
        if active_company:
             dup_filter["$or"] = [
                 {"company_name": comp_match},
                 {"company": comp_match}
             ]
        
        existing = departments_collection.find_one(dup_filter)'''

dept_new = '''        company_names = data.get('company_names', [])
        active_company = request.headers.get('X-Company-Name') or data.get('company_name')
        if not company_names and active_company:
            company_names = [active_company]

        dup_filter = {"name": {"$regex": f"^{str(data['name']).strip()}$", "$options": "i"}}
        if company_names:
             dup_filter["$or"] = [
                 {"company_names": {"$in": company_names}},
                 {"company_name": {"$in": company_names}},
                 {"company": {"$in": company_names}}
             ]
             
        existing = departments_collection.find_one(dup_filter)'''

if dept_old in content:
    content = content.replace(dept_old, dept_new)
    print("Patched /api/departments POST")

# Patch /api/employee-designations duplicate check
desig_old = '''            # Check if name already exists ONLY within the same company
            existing = employee_designations_collection.find_one({"name": name.strip(), **data_scope_filter})'''

desig_new = '''            # Check if name already exists ONLY within the same company
            company_names = data.get('company_names', [])
            active_company = request.headers.get('X-Company-Name') or data.get('company_name')
            if not company_names and active_company:
                company_names = [active_company]

            dup_filter = {"name": {"$regex": f"^{str(name).strip()}$", "$options": "i"}}
            if company_names:
                dup_filter["$or"] = [
                    {"company_names": {"$in": company_names}},
                    {"company_name": {"$in": company_names}},
                    {"company": {"$in": company_names}}
                ]
            else:
                dup_filter.update(data_scope_filter)

            existing = employee_designations_collection.find_one(dup_filter)'''

if desig_old in content:
    content = content.replace(desig_old, desig_new)
    print("Patched /api/employee-designations POST")

# Patch /api/employee-types duplicate check
type_old = '''            # Check if type name already exists ONLY within the same company
            existing = employee_types_collection.find_one({"type": type_name.strip(), **data_scope_filter})'''

type_new = '''            # Check if type name already exists ONLY within the same company
            company_names = data.get('company_names', [])
            active_company = request.headers.get('X-Company-Name') or data.get('company_name')
            if not company_names and active_company:
                company_names = [active_company]

            dup_filter = {"type": {"$regex": f"^{str(type_name).strip()}$", "$options": "i"}}
            if company_names:
                dup_filter["$or"] = [
                    {"company_names": {"$in": company_names}},
                    {"company_name": {"$in": company_names}},
                    {"company": {"$in": company_names}}
                ]
            else:
                dup_filter.update(data_scope_filter)

            existing = employee_types_collection.find_one(dup_filter)'''

if type_old in content:
    content = content.replace(type_old, type_new)
    print("Patched /api/employee-types POST")

# Patch /api/leave-types duplicate check
leave_old = '''            # Check if leave type name already exists ONLY within the same company
            existing = leave_types_collection.find_one({"name": name.strip(), **data_scope_filter})'''

leave_new = '''            # Check if leave type name already exists ONLY within the same company
            company_names = data.get('company_names', [])
            active_company = request.headers.get('X-Company-Name') or data.get('company_name')
            if not company_names and active_company:
                company_names = [active_company]

            dup_filter = {"name": {"$regex": f"^{str(name).strip()}$", "$options": "i"}}
            if company_names:
                dup_filter["$or"] = [
                    {"company_names": {"$in": company_names}},
                    {"company_name": {"$in": company_names}},
                    {"company": {"$in": company_names}}
                ]
            else:
                dup_filter.update(data_scope_filter)

            existing = leave_types_collection.find_one(dup_filter)'''

if leave_old in content:
    content = content.replace(leave_old, leave_new)
    print("Patched /api/leave-types POST")

with open(r'c:\manoj\backend\app1.py', 'w', encoding='utf-8') as f:
    f.write(content)

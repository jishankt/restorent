import re

with open(r'c:\manoj\backend\app1.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Patch /api/leave-types duplicate check and UnboundLocalError
leave_old = '''            # Check for duplicate leave_code within the same context
            duplicate_filter = data_scope_filter.copy()
            duplicate_filter['leave_code'] = data['leave_code']
            existing = leave_types_collection.find_one(duplicate_filter)'''

leave_new = '''            # Check for duplicate leave_code within the same context
            company_names = data.get('company_names', [])
            active_company = request.headers.get('X-Company-Name') or data.get('company_name')
            if not company_names and active_company:
                company_names = [active_company]

            duplicate_filter = {"leave_code": data['leave_code']}
            if company_names:
                duplicate_filter["$or"] = [
                    {"company_names": {"$in": company_names}},
                    {"company_name": {"$in": company_names}},
                    {"company": {"$in": company_names}}
                ]
            else:
                _, data_scope_filter = get_data_scope_filter('leave_types')
                duplicate_filter.update(data_scope_filter)

            existing = leave_types_collection.find_one(duplicate_filter)'''

if leave_old in content:
    content = content.replace(leave_old, leave_new)
    print("Patched /api/leave-types POST")

with open(r'c:\manoj\backend\app1.py', 'w', encoding='utf-8') as f:
    f.write(content)

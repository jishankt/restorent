import re
with open('../app1.py', 'r', encoding='utf-8') as f:
    content = f.read()

def_get_all_customers = '''def get_all_customers():
    try:
        # --- Centralized Permission Filtering ---
        can_access, filter_query = get_data_scope_filter('customer_list', owner_field='createdBy')
        if not can_access:
            return jsonify([]), 200

        # Enhance with explicit ID-based filtering for strict isolation
        user_id, role = get_request_user_info()
        user_doc = users_collection.find_one({'_id': user_id}) if user_id else {}
        
        # 1. Resolve active tenant, company, branch from context
        active_company = get_request_company()
        active_branch = get_request_branch()
        
        tenant_id = user_doc.get('tenant_id') if user_doc else None
        
        # Build strict scope query
        strict_scope_clauses = []
        
        # Tenant filter (baseline)
        if tenant_id:
            strict_scope_clauses.append({'tenant_id': tenant_id})
            
        # Company filter
        if active_company and active_company.lower() not in ['all', 'all companies', 'none', 'null']:
            company_doc = company_details_collection.find_one({'restaurantName': active_company})
            c_id = company_doc.get('_id') if company_doc else None
            c_clause = {'$or': [{'company_name': active_company}]}
            if c_id:
                c_clause['$or'].append({'company_id': str(c_id)})
            strict_scope_clauses.append(c_clause)
            
        # Branch filter
        if active_branch and active_branch.lower() not in ['all', 'all branches', 'any']:
            branch_doc = branches_collection.find_one({'branch_name': active_branch})
            b_id = branch_doc.get('_id') if branch_doc else None
            b_clause = {'$or': [{'branch_name': active_branch}]}
            if b_id:
                b_clause['$or'].append({'branch_id': str(b_id)})
            strict_scope_clauses.append(b_clause)
            
        if strict_scope_clauses:
            if filter_query:
                filter_query = {'$and': [filter_query] + strict_scope_clauses}
            else:
                filter_query = {'$and': strict_scope_clauses}

        # SAAS ENHANCEMENT: If Company Admin, also filter by company_id (UUID-based)
        if role == 'Company Admin' and user_id and user_doc and user_doc.get('company_id'):
            company_id = user_doc['company_id']
            # Add company_id filter on top of existing filter
            filter_query = {
                '$and': [
                    filter_query,
                    {'$or': [
                        {'company_id': company_id},
                        {'company_id': {'$exists': False}}  # legacy records without company_id still visible
                    ]}
                ]
            } if filter_query else {'company_id': company_id}

        customers = customers_collection.find(filter_query)
        customers = [convert_objectid_to_str(customer) for customer in customers]
        logger.info(f"Fetched {len(customers)} customers with strict scope filter")
        return jsonify(customers), 200
    except Exception as e:
        logger.error(f"Error fetching customers: {str(e)}")
        return jsonify({"error": str(e)}), 500'''

def_get_customers_count = '''def get_customers_count():
    try:
        # STRICT: Get standardized scoping filter
        can_access, filter_query = get_data_scope_filter('customer_list', owner_field='createdBy')
        if not can_access:
            logger.warning(f"[Customers Count] Access Denied for user context")
            return jsonify({"count": 0}), 200
            
        # Enhance with explicit ID-based filtering for strict isolation
        user_id, role = get_request_user_info()
        user_doc = users_collection.find_one({'_id': user_id}) if user_id else {}
        
        # 1. Resolve active tenant, company, branch from context
        active_company = get_request_company()
        active_branch = get_request_branch()
        
        tenant_id = user_doc.get('tenant_id') if user_doc else None
        
        # Build strict scope query
        strict_scope_clauses = []
        
        # Tenant filter (baseline)
        if tenant_id:
            strict_scope_clauses.append({'tenant_id': tenant_id})
            
        # Company filter
        if active_company and active_company.lower() not in ['all', 'all companies', 'none', 'null']:
            company_doc = company_details_collection.find_one({'restaurantName': active_company})
            c_id = company_doc.get('_id') if company_doc else None
            c_clause = {'$or': [{'company_name': active_company}]}
            if c_id:
                c_clause['$or'].append({'company_id': str(c_id)})
            strict_scope_clauses.append(c_clause)
            
        # Branch filter
        if active_branch and active_branch.lower() not in ['all', 'all branches', 'any']:
            branch_doc = branches_collection.find_one({'branch_name': active_branch})
            b_id = branch_doc.get('_id') if branch_doc else None
            b_clause = {'$or': [{'branch_name': active_branch}]}
            if b_id:
                b_clause['$or'].append({'branch_id': str(b_id)})
            strict_scope_clauses.append(b_clause)
            
        if strict_scope_clauses:
            if filter_query:
                filter_query = {'$and': [filter_query] + strict_scope_clauses}
            else:
                filter_query = {'$and': strict_scope_clauses}

        # Ensure we count active customers (if status exists)
        final_query = filter_query.copy() if filter_query else {}
        
        # USE find() + len() because count_documents is NOT supported by the SQLite wrapper
        count = len(list(customers_collection.find(final_query)))
        logger.info(f"[Customers Count] Query: {final_query} Result: {count}")
        return jsonify({"count": count}), 200
    except Exception as e:
        logger.error(f"Error in customers-count: {e}")
        return jsonify({"count": 0}), 200'''

content = re.sub(r'def get_all_customers\(\):.*?return jsonify\(\{"error": str\(e\)\}\), 500', def_get_all_customers, content, flags=re.DOTALL)
content = re.sub(r'def get_customers_count\(\):.*?return jsonify\(\{"count": 0\}\), 200', def_get_customers_count, content, flags=re.DOTALL)

with open('../app1.py', 'w', encoding='utf-8') as f:
    f.write(content)
print('Patch applied successfully.')

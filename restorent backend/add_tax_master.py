import re

app_file = 'c:\\manoj\\backend\\restaurant-pos-backend\\app1.py'
with open(app_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add tax_master_collection to global declarations
if 'tax_master_collection' not in content:
    content = content.replace('doctypes_collection', 'doctypes_collection, tax_master_collection')
    content = content.replace("'brands',", "'brands', 'tax_master',")

# 2. Add collection initialization
if "tax_master_collection = SQLiteCollection(conn, 'tax_master')" not in content:
    init_str = "        tax_master_collection = SQLiteCollection(conn, 'tax_master')"
    content = content.replace("brands_collection = SQLiteCollection(conn, 'brands')", 
                              f"brands_collection = SQLiteCollection(conn, 'brands')\n{init_str}")

# 3. Add Endpoints
tax_endpoints = """
# --- Tax Master API Endpoints ---
@app.route('/api/taxes', methods=['GET'])
@db_required
def get_taxes():
    try:
        can_access, data_scope_filter = get_data_scope_filter('admin') # Admin or general settings access
        if not can_access:
            return jsonify([]), 200

        taxes = tax_master_collection.find(data_scope_filter)
        return jsonify(convert_objectid_to_str(taxes)), 200
    except Exception as e:
        return jsonify({'error': f"Failed to fetch taxes: {str(e)}"}), 500

@app.route('/api/taxes', methods=['POST'])
@db_required
def add_tax():
    try:
        can_access, data_scope_filter = get_data_scope_filter('admin')
        if not can_access:
            return jsonify({'error': 'Access denied'}), 403

        data = request.json
        if not data or 'tax_name' not in data or 'tax_rate' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        tax = {
            'tax_name': data['tax_name'].strip(),
            'tax_type': data.get('tax_type', 'VAT'),
            'tax_rate': float(data['tax_rate']),
            'is_active': data.get('is_active', True),
            'company': request.headers.get('X-Company-Name'),
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        result = tax_master_collection.insert_one(tax)
        inserted_tax = tax_master_collection.find_one({'_id': result.inserted_id})
        return jsonify(convert_objectid_to_str(inserted_tax)), 201
    except Exception as e:
        return jsonify({'error': f"Failed to add tax: {str(e)}"}), 500

@app.route('/api/taxes/<id>', methods=['PUT'])
@db_required
def update_tax(id):
    try:
        data = request.json
        tax = {
            'tax_name': data['tax_name'].strip(),
            'tax_type': data.get('tax_type', 'VAT'),
            'tax_rate': float(data['tax_rate']),
            'is_active': data.get('is_active', True),
            'company': request.headers.get('X-Company-Name'),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        from bson import ObjectId
        try:
            query_id = ObjectId(id)
        except:
            query_id = id
        result = tax_master_collection.update_one({'_id': query_id}, {'$set': tax})
        if result.matched_count == 0:
            query_id = id
            result = tax_master_collection.update_one({'_id': query_id}, {'$set': tax})
        if result.matched_count == 0:
            return jsonify({'error': 'Tax not found'}), 404
        updated = tax_master_collection.find_one({'_id': query_id})
        return jsonify(convert_objectid_to_str(updated)), 200
    except Exception as e:
        return jsonify({'error': f"Failed to update tax: {str(e)}"}), 500

@app.route('/api/taxes/<id>', methods=['DELETE'])
@db_required
def delete_tax(id):
    try:
        from bson import ObjectId
        try:
            query_id = ObjectId(id)
        except:
            query_id = id
        result = tax_master_collection.delete_one({'_id': query_id})
        if result.deleted_count == 0:
            query_id = id
            result = tax_master_collection.delete_one({'_id': query_id})
        if result.deleted_count == 0:
            return jsonify({'error': 'Tax not found'}), 404
        return jsonify({'message': 'Tax deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f"Failed to delete tax: {str(e)}"}), 500
"""

if 'def get_taxes():' not in content:
    # Insert right before brand endpoints
    content = content.replace("# --- Brand Management API Endpoints ---", tax_endpoints + "\n# --- Brand Management API Endpoints ---")

with open(app_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Tax master endpoints added to app1.py")

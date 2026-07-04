
# ==========================================
# SUPER ADMIN GALLERY ENDPOINTS (STRICT ISOLATION)
# ==========================================

def is_super_admin():
    user_id, user_role = get_request_user_info()
    return 'superadmin' in str(user_role).lower() or 'groupadmin' in str(user_role).lower()

@app.route('/api/item-gallery', methods=['GET'])
def get_item_gallery():
    try:
        items = list(item_gallery_collection.find({}))
        return jsonify({"items": items}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/item-gallery', methods=['POST'])
def create_item_gallery():
    try:
        if not is_super_admin(): return jsonify({"error": "Forbidden"}), 403
        data = request.json
        data['_id'] = str(__import__('uuid').uuid4())
        data['created_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
        item_gallery_collection.insert_one(data)
        return jsonify(convert_objectid_to_str(data)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/item-gallery/<item_id>', methods=['PUT'])
def update_item_gallery(item_id):
    try:
        if not is_super_admin(): return jsonify({"error": "Forbidden"}), 403
        data = request.json
        item_gallery_collection.replace_one({'_id': item_id}, data)
        return jsonify({"message": "Updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/item-gallery/<item_id>', methods=['DELETE'])
def delete_item_gallery(item_id):
    try:
        if not is_super_admin(): return jsonify({"error": "Forbidden"}), 403
        item_gallery_collection.delete_one({'_id': item_id})
        return jsonify({"message": "Deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/kitchen-gallery', methods=['GET'])
def get_kitchen_gallery():
    try:
        docs = list(kitchen_gallery_collection.find({}))
        return jsonify({"kitchens": docs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/kitchen-gallery', methods=['POST'])
def create_kitchen_gallery():
    try:
        if not is_super_admin(): return jsonify({"error": "Forbidden"}), 403
        data = request.json
        data['_id'] = str(__import__('uuid').uuid4())
        kitchen_gallery_collection.insert_one(data)
        return jsonify(convert_objectid_to_str(data)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/item-group-gallery', methods=['GET'])
def get_item_group_gallery():
    try:
        docs = list(item_group_gallery_collection.find({}))
        return jsonify({"item_groups": docs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/item-group-gallery', methods=['POST'])
def create_item_group_gallery():
    try:
        if not is_super_admin(): return jsonify({"error": "Forbidden"}), 403
        data = request.json
        data['_id'] = str(__import__('uuid').uuid4())
        item_group_gallery_collection.insert_one(data)
        return jsonify(convert_objectid_to_str(data)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

import sys
import os

app1_path = r'c:\manoj\backend\restaurant-pos-backend\app1.py'

with open(app1_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_logic = """def bulk_upload_images():
    try:
        user_id, _ = get_request_user_info()
        company_name_header = request.headers.get('X-Company-Name', '').strip()

        if 'images' not in request.files:
            return jsonify({"error": "No images provided"}), 400

        images = request.files.getlist('images')
        stats = {"total": len(images), "matched": 0, "unmatched": 0, "errors": 0}

        base_query = {}
        if company_name_header and company_name_header.lower() != 'all':
            base_query["company_name"] = company_name_header
        
        all_items = list(items_collection.find(base_query))
        
        # Build mapping for items, addons, combos
        image_targets_map = {}
        for item in all_items:
            item_id = item.get("_id")
            
            i_name = str(item.get("item_name", "")).strip()
            if i_name:
                normalized = i_name.lower().replace('_', ' ').replace('-', ' ')
                if normalized not in image_targets_map:
                    image_targets_map[normalized] = []
                image_targets_map[normalized].append({"item_id": item_id, "type": "item", "orig_name": i_name})
            
            addons = item.get("addons", [])
            if isinstance(addons, list):
                for idx, addon in enumerate(addons):
                    a_name = str(addon.get("name1", "")).strip()
                    if a_name:
                        normalized = a_name.lower().replace('_', ' ').replace('-', ' ')
                        if normalized not in image_targets_map:
                            image_targets_map[normalized] = []
                        image_targets_map[normalized].append({"item_id": item_id, "type": "addon", "index": idx, "orig_name": a_name})
                        
            combos = item.get("combos", [])
            if isinstance(combos, list):
                for idx, combo in enumerate(combos):
                    c_name = str(combo.get("name1", "")).strip()
                    if c_name:
                        normalized = c_name.lower().replace('_', ' ').replace('-', ' ')
                        if normalized not in image_targets_map:
                            image_targets_map[normalized] = []
                        image_targets_map[normalized].append({"item_id": item_id, "type": "combo", "index": idx, "orig_name": c_name})

        import difflib
        import re
        
        # Sort keys by length descending to match more specific names first
        sorted_target_keys = sorted(list(image_targets_map.keys()), key=len, reverse=True)

        for file in images:
            if file and file.filename:
                original_name = file.filename
                base_name = os.path.splitext(original_name)[0].strip()

                ext = os.path.splitext(original_name)[1].lower()
                import uuid
                from werkzeug.utils import secure_filename
                new_filename = secure_filename(f"{uuid.uuid4()}{ext}")
                abs_upload_folder = os.path.abspath(app.config.get('UPLOAD_FOLDER', 'static/uploads'))
                file_path = os.path.join(abs_upload_folder, new_filename)

                try:
                    logger.info(f"Saving bulk image to {file_path}")
                    file.save(file_path)
                    if not os.path.exists(file_path):
                        logger.error(f"Failed to verify file on disk: {file_path}")
                    
                    new_image_url = f"/api/images/{new_filename}"

                    normalized_base = base_name.lower().replace('_', ' ').replace('-', ' ')
                    best_match_key = None
                    
                    if normalized_base in image_targets_map:
                        best_match_key = normalized_base
                    else:
                        for n_name in sorted_target_keys:
                            if normalized_base in n_name or n_name in normalized_base:
                                best_match_key = n_name
                                break
                        
                        if not best_match_key:
                            matches = difflib.get_close_matches(normalized_base, sorted_target_keys, n=1, cutoff=0.5)
                            if matches:
                                best_match_key = matches[0]

                    if best_match_key:
                        targets = image_targets_map[best_match_key]
                        matched_any = False
                        
                        updates_by_item = {}
                        for t in targets:
                            item_id = t["item_id"]
                            if item_id not in updates_by_item:
                                full_item = next((i for i in all_items if i["_id"] == item_id), None)
                                if full_item:
                                    updates_by_item[item_id] = full_item
                            
                            full_item = updates_by_item.get(item_id)
                            if not full_item: continue
                            
                            if t["type"] == "item":
                                full_item["image"] = new_image_url
                                matched_any = True
                            elif t["type"] == "addon":
                                if "addons" in full_item and len(full_item["addons"]) > t["index"]:
                                    full_item["addons"][t["index"]]["addon_image"] = new_filename
                                    matched_any = True
                            elif t["type"] == "combo":
                                if "combos" in full_item and len(full_item["combos"]) > t["index"]:
                                    full_item["combos"][t["index"]]["combo_image"] = new_filename
                                    matched_any = True
                                    
                        if matched_any:
                            for item_id, updated_item in updates_by_item.items():
                                set_dict = {}
                                if "image" in updated_item: set_dict["image"] = updated_item["image"]
                                if "addons" in updated_item: set_dict["addons"] = updated_item["addons"]
                                if "combos" in updated_item: set_dict["combos"] = updated_item["combos"]
                                
                                items_collection.update_many({"_id": item_id}, {"$set": set_dict})
                                
                            stats["matched"] += 1
                        else:
                            stats["unmatched"] += 1
                    else:
                        stats["unmatched"] += 1
                except Exception as e:
                    logger.error(f"Error processing bulk image {original_name}: {e}")
                    stats["errors"] += 1

        return jsonify({"message": "Bulk image upload completed", "stats": stats}), 200
    except Exception as e:
        logger.error(f"Bulk upload images error: {e}")
        return jsonify({"error": str(e)}), 500
"""

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if line.startswith('def bulk_upload_images():'):
        start_idx = i
    if line.startswith('# NEW: Advanced Multi-Table Import Route'):
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    lines = lines[:start_idx] + [new_logic + '\n'] + lines[end_idx:]
    with open(app1_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully updated app1.py")
else:
    print(f"Could not find start or end block. start_idx={start_idx}, end_idx={end_idx}")

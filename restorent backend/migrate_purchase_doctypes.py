import sys
from pymongo import MongoClient

def migrate_purchase_doctypes():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['restaurant_pos']
    
    target_doctypes = [
        "Purchase Item", 
        "Supplier", 
        "Purchase Order", 
        "Purchase Receipt", 
        "Purchase Invoice", 
        "Purchase Report"
    ]
    
    print("Deleting old doctype configurations for:", target_doctypes)
    result = db.doctypes.delete_many({"name": {"$in": target_doctypes}})
    print(f"Deleted {result.deleted_count} old doctypes.")
    
    # We don't necessarily need to insert them manually here, because 
    # CustomerCustomizationModal allows creating fields from scratch. 
    # BUT, to prevent the UI from failing if they don't exist, we can seed them with empty fields list.
    
    doctypes_to_insert = []
    for dt in target_doctypes:
        doctypes_to_insert.append({
            "name": dt,
            "fields": []
        })
        
    db.doctypes.insert_many(doctypes_to_insert)
    print(f"Successfully migrated (seeded) {len(doctypes_to_insert)} Purchase doctypes.")

if __name__ == "__main__":
    migrate_purchase_doctypes()

from app1 import doctypes_collection, connect_to_sqlite
import uuid
from datetime import datetime, timezone

connect_to_sqlite()

doctype = {
    '_id': str(uuid.uuid4()),
    'name': 'Tax Master',
    'module': 'Setup',
    'fields': [
        {'id': 'tax_name', 'label': 'Tax Name', 'type': 'Data', 'mandatory': True},
        {'id': 'tax_type', 'label': 'Tax Type', 'type': 'Select', 'options': 'VAT\nExcise Duty\nGST\nService Charge', 'mandatory': True},
        {'id': 'tax_rate', 'label': 'Tax Rate (%)', 'type': 'Float', 'mandatory': True},
        {'id': 'is_active', 'label': 'Is Active', 'type': 'Check', 'default_value': True}
    ],
    'is_custom': False,
    'company_names': [],
    'branch_names': [],
    'created_at': datetime.now(timezone.utc).isoformat(),
    'updated_at': datetime.now(timezone.utc).isoformat()
}

existing = doctypes_collection.find_one({'name': 'Tax Master'})
if not existing:
    doctypes_collection.insert_one(doctype)
    print("Migrated Tax Master doctype to SQLite.")
else:
    print("Tax Master doctype already exists.")

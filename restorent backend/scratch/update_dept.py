import sqlite3
import json

db_path = 'restaurant.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

new_data = {
    "name": "Employee Department",
    "company_names": ["All"],
    "settings": {"enable_otp_on_edit": False},
    "fields": [
        {"id": "department_name", "label": "Department Name", "type": "Data", "mandatory": True, "is_default": True},
        {"id": "is_active", "label": "Active Status", "type": "Check", "mandatory": False, "is_default": True},
        {"id": "description", "label": "Description", "type": "Text", "mandatory": False, "is_default": True},
        {"label": "manoj", "type": "Data", "mandatory": True, "allow_create_new": False, "hidden": False, "id": "manoj", "is_default": False}
    ]
}

cur.execute("UPDATE doctypes SET data = ? WHERE id = ?", (json.dumps(new_data), "54627394-f892-4595-8f95-b96427b0ca25"))
conn.commit()
conn.close()
print("Update successful")

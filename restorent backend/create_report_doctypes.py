import requests
import json
import os

doctypes = [
    {
        "name": "Supplier Report",
        "company_names": ["All"],
        "fields": [
            {"id": "code", "label": "Code", "type": "Data", "mandatory": True, "is_default": True, "hidden": False, "idx": 0},
            {"id": "company", "label": "Company Name", "type": "Data", "mandatory": True, "is_default": True, "hidden": False, "idx": 1},
            {"id": "group", "label": "Group", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 2},
            {"id": "country", "label": "Country", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 3},
            {"id": "currency", "label": "Currency", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 4},
            {"id": "taxId", "label": "Tax ID", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 5},
            {"id": "contacts", "label": "Contacts", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 6},
            {"id": "lastPurchaseDate", "label": "Last Purchase Date", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 7},
            {"id": "actions", "label": "Actions", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 8}
        ]
    },
    {
        "name": "Purchase Item Report",
        "company_names": ["All"],
        "fields": [
            {"id": "name", "label": "Item Name", "type": "Data", "mandatory": True, "is_default": True, "hidden": False, "idx": 0},
            {"id": "company", "label": "Brand", "type": "Data", "mandatory": True, "is_default": True, "hidden": False, "idx": 1},
            {"id": "grams", "label": "Grams", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 2},
            {"id": "totalQuantity", "label": "Total Quantity", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 3},
            {"id": "totalPurchased", "label": "Total Purchased", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 4},
            {"id": "rate", "label": "Rate", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 5},
            {"id": "totalAmount", "label": "Total Amount", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 6},
            {"id": "suppliers", "label": "Suppliers", "type": "Data", "mandatory": False, "is_default": True, "hidden": False, "idx": 7}
        ]
    }
]

for dt in doctypes:
    res = requests.post('http://localhost:6034/api/doctypes', json=dt)
    print(f"Created {dt['name']}: {res.status_code}")

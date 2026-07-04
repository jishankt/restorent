import sqlite3
import json
import uuid

conn = sqlite3.connect('restaurant.db')
cursor = conn.cursor()

schemas = {
    'Purchase Item': [
        {"id": "item_name", "label": "Item Name", "type": "Data", "mandatory": True, "hidden": False, "idx": 0},
        {"id": "item_code", "label": "Item Code", "type": "Data", "mandatory": True, "hidden": False, "idx": 1},
        {"id": "item_group", "label": "Item Group", "type": "Select", "mandatory": False, "hidden": False, "idx": 2, "options": "Raw Material\nConsumable\nAsset"},
        {"id": "uom", "label": "Unit of Measure", "type": "Select", "mandatory": True, "hidden": False, "idx": 3, "options": "Nos\nKg\nLitre\nBox"},
        {"id": "brand", "label": "Brand", "type": "Data", "mandatory": False, "hidden": False, "idx": 4},
        {"id": "cost_price", "label": "Cost Price", "type": "Number", "mandatory": False, "hidden": False, "idx": 5},
        {"id": "description", "label": "Description", "type": "Text", "mandatory": False, "hidden": False, "idx": 6}
    ],
    'Supplier': [
        {"id": "supplier_name", "label": "Supplier Name", "type": "Data", "mandatory": True, "hidden": False, "idx": 0},
        {"id": "supplier_group", "label": "Supplier Group", "type": "Select", "mandatory": False, "hidden": False, "idx": 1, "options": "Local\nInternational\nWholesale"},
        {"id": "contact_person", "label": "Contact Person", "type": "Data", "mandatory": False, "hidden": False, "idx": 2},
        {"id": "phone_number", "label": "Phone Number", "type": "Data", "mandatory": True, "hidden": False, "idx": 3},
        {"id": "email_address", "label": "Email Address", "type": "Data", "mandatory": False, "hidden": False, "idx": 4},
        {"id": "address", "label": "Billing Address", "type": "Text", "mandatory": False, "hidden": False, "idx": 5},
        {"id": "tax_id", "label": "Tax ID / GSTIN", "type": "Data", "mandatory": False, "hidden": False, "idx": 6}
    ],
    'Purchase Order': [
        {"id": "supplier", "label": "Supplier", "type": "Data", "mandatory": True, "hidden": False, "idx": 0},
        {"id": "order_date", "label": "Order Date", "type": "Date", "mandatory": True, "hidden": False, "idx": 1},
        {"id": "expected_delivery_date", "label": "Expected Delivery Date", "type": "Date", "mandatory": False, "hidden": False, "idx": 2},
        {"id": "status", "label": "Status", "type": "Select", "mandatory": True, "hidden": False, "idx": 3, "options": "Draft\nSubmitted\nCompleted\nCancelled"},
        {"id": "total_amount", "label": "Total Amount", "type": "Number", "mandatory": False, "hidden": False, "idx": 4}
    ],
    'Purchase Receipt': [
        {"id": "purchase_order", "label": "Purchase Order", "type": "Data", "mandatory": False, "hidden": False, "idx": 0},
        {"id": "receipt_date", "label": "Receipt Date", "type": "Date", "mandatory": True, "hidden": False, "idx": 1},
        {"id": "supplier_delivery_note", "label": "Supplier Delivery Note", "type": "Data", "mandatory": False, "hidden": False, "idx": 2},
        {"id": "received_by", "label": "Received By", "type": "Data", "mandatory": False, "hidden": False, "idx": 3},
        {"id": "status", "label": "Status", "type": "Select", "mandatory": True, "hidden": False, "idx": 4, "options": "Draft\nSubmitted\nCancelled"}
    ],
    'Purchase Invoice': [
        {"id": "supplier", "label": "Supplier", "type": "Data", "mandatory": True, "hidden": False, "idx": 0},
        {"id": "invoice_number", "label": "Supplier Invoice Number", "type": "Data", "mandatory": True, "hidden": False, "idx": 1},
        {"id": "invoice_date", "label": "Invoice Date", "type": "Date", "mandatory": True, "hidden": False, "idx": 2},
        {"id": "amount", "label": "Amount", "type": "Number", "mandatory": True, "hidden": False, "idx": 3},
        {"id": "payment_status", "label": "Payment Status", "type": "Select", "mandatory": True, "hidden": False, "idx": 4, "options": "Unpaid\nPartially Paid\nPaid"}
    ],
    'Purchase Report': [
        {"id": "report_type", "label": "Report Type", "type": "Select", "mandatory": True, "hidden": False, "idx": 0, "options": "Item Wise\nSupplier Wise\nDate Wise"},
        {"id": "from_date", "label": "From Date", "type": "Date", "mandatory": False, "hidden": False, "idx": 1},
        {"id": "to_date", "label": "To Date", "type": "Date", "mandatory": False, "hidden": False, "idx": 2},
        {"id": "supplier_filter", "label": "Filter by Supplier", "type": "Data", "mandatory": False, "hidden": False, "idx": 3}
    ]
}

try:
    print('Deleting existing configurations...')
    cursor.execute('SELECT id, data FROM doctypes')
    rows = cursor.fetchall()
    deleted_ids = []
    for row_id, data_str in rows:
        data = json.loads(data_str)
        if data.get('name') in schemas.keys():
            deleted_ids.append(row_id)
            print(f'Deleting {data.get("name")} (id: {row_id})')
    
    if deleted_ids:
        placeholders = ','.join(['?']*len(deleted_ids))
        cursor.execute(f'DELETE FROM doctypes WHERE id IN ({placeholders})', deleted_ids)
        print(f'Deleted {len(deleted_ids)} old records.')

    print('Inserting fresh configurations with fields...')
    for name, fields in schemas.items():
        row_id = uuid.uuid4().hex
        data = json.dumps({'name': name, 'fields': fields})
        cursor.execute('INSERT INTO doctypes (id, data) VALUES (?, ?)', (row_id, data))
        print(f'Inserted {name} with {len(fields)} fields.')

    conn.commit()
    print('Successfully migrated purchase doctypes with default fields.')
except Exception as e:
    print('Error:', e)
finally:
    conn.close()

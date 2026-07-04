import os
import json

doctypes_dir = 'c:\\manoj\\backend\\restaurant-pos-backend\\doctypes'
for filename in os.listdir(doctypes_dir):
    if filename.startswith('Global_') and filename.endswith('.json'):
        filepath = os.path.join(doctypes_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            modified = False
            for key in ['company_names', 'branch_names', 'tenancy']:
                if key in data and data[key] == ['All']:
                    data[key] = ['Global']
                    modified = True
            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                print(f'Fixed {filename}')
        except Exception as e:
            print(f'Error processing {filename}: {e}')

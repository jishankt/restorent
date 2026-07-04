import sqlite3
import json
import os
import sys

# Add backend directory to sys.path to import app1
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app1

# Init database
app1.connect_to_sqlite()

tenant_id = '42b66335-ab26-4574-9a3b-a7e06bf195ba'
settings_data = {}
filtered_settings = app1.filter_settings_by_plan(tenant_id, settings_data)

global_mods = filtered_settings.get('global_modules', {})

print("POS Billing Module Enabled:", global_mods.get('pos_billing', {}).get('enabled'))
print("POS Billing Pages:")
for pk, pv in global_mods.get('pos_billing', {}).get('pages', {}).items():
    print(f"  - {pk}: {pv}")

print("\nReports Module Enabled:", global_mods.get('reports', {}).get('enabled'))
print("Reports Pages:")
for pk, pv in global_mods.get('reports', {}).get('pages', {}).items():
    print(f"  - {pk}: {pv}")

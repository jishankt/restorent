import requests
import json

base_url = "http://localhost:5000" # Assuming it's running or I simulate the call

# Simulation of the backend fix effect
active_branch = "Kyle1"
is_operational_page = True
is_company_master = True
is_shared_config = False

# New logic
if is_shared_config:
    allow_empty_branch = True
elif not active_branch or active_branch.lower() in ['all', 'all branches', 'any']:
    allow_empty_branch = True
elif is_company_master and not is_operational_page:
    allow_empty_branch = True
else:
    allow_empty_branch = False

print(f"allow_empty_branch for {active_branch}: {allow_empty_branch}")

# Expected: False

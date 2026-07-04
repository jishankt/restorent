import re

with open(r'c:\manoj\frontend\src\components\Form\CustomerListPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'const activeBranch = \(localStorage\.getItem\("active_branch"\).*?return true;\s+\}\);\s+setCustomerList\(strictlyFilteredData\);\s+setFilteredCustomers\(strictlyFilteredData\);'

replacement = '''// The backend API now strictly filters by company_id, branch_id, and tenant_id based on context headers.
      // We no longer need fragile string-based client-side isolation filtering.
      setCustomerList(parsedData);
      setFilteredCustomers(parsedData);'''

new_content, count = re.subn(pattern, replacement, content, flags=re.DOTALL)
if count > 0:
    with open(r'c:\manoj\frontend\src\components\Form\CustomerListPage.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'Successfully patched CustomerListPage.jsx ({count} occurrences)')
else:
    print('Failed to find pattern in CustomerListPage.jsx')

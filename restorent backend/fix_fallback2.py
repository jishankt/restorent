import re

def fix_all(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Step 1: Add branch_assigned_for_company = False before if branch_names:
    content = re.sub(
        r'(\s+)if branch_names:',
        r'\1branch_assigned_for_company = False\1if branch_names:',
        content
    )

    # Step 2: Add branch_assigned_for_company = True after created_docs.append(doc) inside the loop
    # We'll match created_docs.append(doc) followed by either 'continue', or the end of the if-block (before else)
    # Actually, it's safer to just replace all `created_docs.append(doc)` that are INSIDE the `if branch_names:` block.
    # But some are in the `else` block!
    # Let's replace `else:` with `if not branch_assigned_for_company:` FIRST.
    
    content = re.sub(
        r'(\s+)else:\s+doc = \{\s+"_id"',
        r'\1if not branch_assigned_for_company:\1    doc = {\1        "_id"',
        content
    )
    
    # Now add `branch_assigned_for_company = True` to the inner inserts!
    # Inner inserts look like:
    #                     created_docs.append(doc)
    #                 continue
    # OR
    #                     created_docs.append(doc)
    #             if not branch_assigned_for_company:
    
    content = re.sub(
        r'(\s+)created_docs\.append\(doc\)\n(\s+)continue',
        r'\1created_docs.append(doc)\n\1branch_assigned_for_company = True\n\2continue',
        content
    )

    content = re.sub(
        r'(\s+)created_docs\.append\(doc\)\n(\s+)if not branch_assigned_for_company:',
        r'\1created_docs.append(doc)\n\1branch_assigned_for_company = True\n\2if not branch_assigned_for_company:',
        content
    )

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Restored fallbacks structurally.")

if __name__ == '__main__':
    fix_all(r'c:\manoj\backend\restaurant-pos-backend\app1.py')

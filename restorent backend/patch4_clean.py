import re

with open('c:\\manoj\\backend\\restaurant-pos-backend\\app1_clean.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out_lines = []
i = 0
replaced = 0

while i < len(lines):
    if "# ALWAYS insert the 'All Branches'" in lines[i]:
        # we found a block!
        indent = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
        
        # Read the doc = { ... } block
        i += 1
        doc_all_lines = []
        while not lines[i].strip() == "}":
            doc_all_lines.append(lines[i])
            i += 1
        doc_all_lines.append(lines[i]) # the "}"
        i += 1
        
        # read the insert statement
        insert_stmt = lines[i]
        collection = re.search(r"([a-zA-Z0-9_]+)\.insert_one", insert_stmt).group(1)
        i += 1
        
        append_stmt = ""
        if "created_docs.append" in lines[i]:
            append_stmt = lines[i]
            i += 1
            
        while lines[i].strip() == "":
            i += 1
            
        # now we are at `# Additionally insert any specific branch assignments`
        i += 1 # skip comment
        i += 1 # skip `if branch_names:`
        i += 1 # skip `for br_name in branch_names:`
        i += 1 # skip `br_ids = _resolve...`
        
        # skip anything that looks like `if not br_ids.get("branch_id"): continue`
        while "continue" in lines[i]:
            i += 1
            
        # now we are at doc = { for specific branch
        doc_spec_lines = []
        while not lines[i].strip() == "}":
            doc_spec_lines.append(lines[i])
            i += 1
        doc_spec_lines.append(lines[i])
        i += 1
        
        # insert and append
        i += 1
        if "created_docs.append" in lines[i]:
            i += 1
            
        # Construct new block
        out_lines.append(f"{indent}if branch_names:\n")
        out_lines.append(f"{indent}    branch_assigned_for_company = False\n")
        out_lines.append(f"{indent}    for br_name in branch_names:\n")
        out_lines.append(f"{indent}        br_ids = _resolve_tenant_company_branch(comp_name, br_name)\n")
        out_lines.append(f"{indent}        if not br_ids.get(\"branch_id\"):\n")
        out_lines.append(f"{indent}            if br_name.lower() in ['all', 'all branches', 'none', 'null', '']:\n")
        for l in doc_all_lines: out_lines.append(f"{indent}            {l.lstrip()}")
        out_lines.append(f"{indent}            {insert_stmt.lstrip()}")
        if append_stmt: out_lines.append(f"{indent}            {append_stmt.lstrip()}")
        out_lines.append(f"{indent}            branch_assigned_for_company = True\n")
        out_lines.append(f"{indent}        continue\n\n")
        
        for l in doc_spec_lines: out_lines.append(f"{indent}        {l.lstrip()}")
        out_lines.append(f"{indent}        {insert_stmt.lstrip()}")
        if append_stmt: out_lines.append(f"{indent}        {append_stmt.lstrip()}")
        out_lines.append(f"{indent}        branch_assigned_for_company = True\n\n")
        
        out_lines.append(f"{indent}    if not branch_assigned_for_company:\n")
        for l in doc_all_lines: out_lines.append(f"{indent}        {l.lstrip()}")
        out_lines.append(f"{indent}        {insert_stmt.lstrip()}")
        if append_stmt: out_lines.append(f"{indent}        {append_stmt.lstrip()}")
        out_lines.append(f"{indent}else:\n")
        for l in doc_all_lines: out_lines.append(f"{indent}    {l.lstrip()}")
        out_lines.append(f"{indent}    {insert_stmt.lstrip()}")
        if append_stmt: out_lines.append(f"{indent}    {append_stmt.lstrip()}")
        
        replaced += 1
        continue
        
    out_lines.append(lines[i])
    i += 1

print(f"Replaced {replaced} creation loops!")
with open('c:\\manoj\\backend\\restaurant-pos-backend\\app1_clean.py', 'w', encoding='utf-8') as f:
    f.writelines(out_lines)

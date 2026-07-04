import re

def main():
    with open('c:\\manoj\\backend\\restaurant-pos-backend\\app1_clean.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # We will search for all blocks that look like this:
    #             # ALWAYS insert the 'All Branches' generic document for the company
    #             doc = {
    #                 ...
    #             }
    #             <collection>.insert_one(doc)
    #             created_docs.append(doc)
    #
    #             # Additionally insert any specific branch assignments
    #             if branch_names:
    #                 for br_name in branch_names:
    #                     br_ids = _resolve_tenant_company_branch(comp_name, br_name)
    #                     if not br_ids.get("branch_id"): continue
    #                     
    #                     doc = {
    #                         ...
    #                     }
    #                     <collection>.insert_one(doc)
    #                     created_docs.append(doc)

    pattern = re.compile(
        r"([ \t]*)# ALWAYS insert the 'All Branches' generic document for the company\n"
        r"([ \t]*)doc = \{(.*?)\n\2\}\n"
        r"([ \t]*)([a-zA-Z0-9_]+)\.insert_one\(doc\)\n"
        r"([ \t]*)(?:created_docs\.append\(doc\)\n)?"
        r"\n?"
        r"([ \t]*)# Additionally insert any specific branch assignments\n"
        r"([ \t]*)if branch_names:\n"
        r"([ \t]*)for br_name in branch_names:\n"
        r"([ \t]*)br_ids = _resolve_tenant_company_branch\(comp_name, br_name\)\n"
        r"([ \t]*)if not br_ids\.get\(\"branch_id\"\): continue\n"
        r"\s*doc = \{(.*?)\n\10\}\n"
        r"([ \t]*)\5\.insert_one\(doc\)\n"
        r"([ \t]*)(?:created_docs\.append\(doc\)\n)?",
        re.DOTALL
    )

    def replacer(m):
        indent_base = m.group(1)
        doc_all = m.group(3)
        collection = m.group(5)
        append_all = "created_docs.append(doc)" if "created_docs.append" in m.group(0) else ""
        
        doc_specific = m.group(12)
        
        indent1 = indent_base
        indent2 = indent_base + "    "
        indent3 = indent_base + "        "
        indent4 = indent_base + "            "

        new_code = f"""{indent1}if branch_names:
{indent2}branch_assigned_for_company = False
{indent2}for br_name in branch_names:
{indent3}br_ids = _resolve_tenant_company_branch(comp_name, br_name)
{indent3}if not br_ids.get("branch_id"):
{indent4}if br_name.lower() in ['all', 'all branches', 'none', 'null', '']:
{indent4}    doc = {{{doc_all}
{indent4}    }}
{indent4}    {collection}.insert_one(doc)
{indent4}    {append_all}
{indent4}    branch_assigned_for_company = True
{indent4}continue

{indent3}doc = {{{doc_specific}
{indent3}}}
{indent3}{collection}.insert_one(doc)
{indent3}{append_all}
{indent3}branch_assigned_for_company = True

{indent2}if not branch_assigned_for_company:
{indent3}doc = {{{doc_all}
{indent3}}}
{indent3}{collection}.insert_one(doc)
{indent3}{append_all}
{indent1}else:
{indent2}doc = {{{doc_all}
{indent2}}}
{indent2}{collection}.insert_one(doc)
{indent2}{append_all}"""
        return new_code

    new_content, count = pattern.subn(replacer, content)
    print(f"Replaced {count} creation blocks")

    # Now we fix the bulk updates
    bulk_pattern = re.compile(
        r"([ \t]*)desired_combinations\.add\(\(comp_name, \"All Branches\"\)\)\n"
        r"([ \t]*)if branch_names:\n"
        r"([ \t]*)for br_name in branch_names:\n"
        r"([ \t]*)br_ids = _resolve_tenant_company_branch\(comp_name, br_name\)\n"
        r"([ \t]*)if br_ids\.get\(\"branch_id\"\):\n"
        r"([ \t]*)desired_combinations\.add\(\(comp_name, br_name\)\)"
    )

    def bulk_replacer(m):
        indent_base = m.group(1)
        indent1 = indent_base
        indent2 = indent_base + "    "
        indent3 = indent_base + "        "
        indent4 = indent_base + "            "

        return f"""{indent1}if branch_names:
{indent2}branch_assigned = False
{indent2}for br_name in branch_names:
{indent3}br_ids = _resolve_tenant_company_branch(comp_name, br_name)
{indent3}if br_ids.get("branch_id"):
{indent4}desired_combinations.add((comp_name, br_name))
{indent4}branch_assigned = True
{indent3}elif br_name.lower() in ['all', 'all branches', 'none', 'null', '']:
{indent4}desired_combinations.add((comp_name, "All Branches"))
{indent4}branch_assigned = True
{indent2}if not branch_assigned:
{indent3}desired_combinations.add((comp_name, "All Branches"))
{indent1}else:
{indent2}desired_combinations.add((comp_name, "All Branches"))"""

    new_content, count_bulk = bulk_pattern.subn(bulk_replacer, new_content)
    print(f"Replaced {count_bulk} bulk update blocks")

    # Now we write back
    with open('c:\\manoj\\backend\\restaurant-pos-backend\\app1_clean.py', 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == '__main__':
    main()

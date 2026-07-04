import app1, json

doc1 = {"company_name": "Kyle", "branch_name": "KYLE1(BR)", "branch": "KYLE1(BR)"}
f = json.loads('''{"$or": [{"branch_name": {"$regex": "(^|,)All(,|$)|(^|,)POS\\\\ 8(,|$)|(^|,)All\\\\ Branches(,|$)|(^|,)all(,|$)|(^|,)Global(,|$)|(^|,)global(,|$)|(^|,)pos8(,|$)","options": "i"}}, {"branch": {"$regex": "(^|,)All(,|$)|(^|,)POS\\\\ 8(,|$)|(^|,)All\\\\ Branches(,|$)|(^|,)all(,|$)|(^|,)Global(,|$)|(^|,)global(,|$)|(^|,)pos8(,|$)","options": "i"}}, {"branch_names": {"$in": ["", null, "All", "POS 8", "All Branches", "all", "Global", "global", "pos8"]}}, {"branch_name": {"$exists": false}}, {"branch_name": null}, {"branch_name": ""}, {"branch_name": {"$regex": "^(all|unassigned|nan)$", "options": "i"}}, {"branch": {"$exists": false}}, {"branch": null}, {"branch": ""}, {"branch_names": []}, {"branch_names": {"$in": ["", "all", "All", "ALL", "Any", "any"]}}]}''')

col = app1.sales_collection
for subf in f['$or']:
    if col.matches_filter(doc1, subf):
        print("MATCHED CLAUSE:", subf)

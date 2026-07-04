import app1, json

can_access, filter_query = app1.get_data_scope_filter('sales_report')
doc1 = {"company_name": "Kyle", "branch_name": "KYLE1(BR)"}

for subf in filter_query['$and'][1]['$or']:
    if app1.sales_collection.matches_filter(doc1, subf):
        print("MATCHING CLAUSE:", subf)

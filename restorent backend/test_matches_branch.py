import sys
import os

# Append the current directory so app1 can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import app1

doc = {'branch_names': '["KYLE1(BR)"]'}
filter_query = {'branch_names': {'$in': ['KYLE1(BR)']}}

print("Match:", app1.sales_collection.matches_filter(doc, filter_query))

import re

def append_to_file():
    target_file = r"c:\manoj\backend\restaurant-pos-backend\app1.py"
    with open(target_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    dashboard_endpoints = """
@app.route('/api/admin-dashboard/metrics', methods=['GET'])
def admin_dashboard_metrics():
    try:
        company = request.args.get('company')
        branch = request.args.get('branch')
        
        query = {}
        if company and company != 'All':
            query['company_name'] = company
            if branch and branch != 'All Branches':
                query['branch_name'] = branch
                
        # Handle cases where the collection might not have company_name but company
        query2 = {}
        if company and company != 'All':
            query2['company'] = company
            if branch and branch != 'All Branches':
                query2['branch'] = branch
                
        customer_count = customers_collection.count_documents(query) + customers_collection.count_documents(query2)
        item_count = items_collection.count_documents(query) + items_collection.count_documents(query2)
        employee_count = worker_collection.count_documents(query) + worker_collection.count_documents(query2)
        
        sales_count = sales_collection.count_documents(query) + sales_collection.count_documents(query2)
        
        return jsonify({
            'customers': customer_count,
            'items': item_count,
            'employees': employee_count,
            'sales_invoices': sales_count
        }), 200
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin-dashboard/chart-data', methods=['GET'])
def admin_dashboard_chart_data():
    try:
        company = request.args.get('company')
        branch = request.args.get('branch')
        date_filter = request.args.get('date_filter', 'monthly') # daily, monthly, yearly
        
        query = {}
        if company and company != 'All':
            query['company_name'] = company
            if branch and branch != 'All Branches':
                query['branch_name'] = branch
                
        # Also check 'company' and 'branch' fields just in case
        sales1 = list(sales_collection.find(query, {'timestamp': 1, 'date': 1, 'created_at': 1, 'grandTotal': 1, 'totalPrice': 1}))
        
        query2 = {}
        if company and company != 'All':
            query2['company'] = company
            if branch and branch != 'All Branches':
                query2['branch'] = branch
                
        sales2 = list(sales_collection.find(query2, {'timestamp': 1, 'date': 1, 'created_at': 1, 'grandTotal': 1, 'totalPrice': 1}))
        
        # Merge lists and remove duplicates by _id
        sales_dict = {str(s.get('_id')): s for s in sales1 + sales2 if s.get('_id')}
        sales = list(sales_dict.values())
        
        from collections import defaultdict
        from datetime import datetime
        
        chart_data = defaultdict(float)
        
        for sale in sales:
            date_val = sale.get('timestamp') or sale.get('date') or sale.get('created_at')
            if not date_val:
                continue
            
            try:
                if isinstance(date_val, str):
                    if 'T' in date_val:
                        dt = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                    else:
                        dt = datetime.strptime(date_val.split(' ')[0], '%Y-%m-%d')
                else:
                    dt = date_val
                
                if date_filter == 'daily':
                    key = dt.strftime('%Y-%m-%d')
                elif date_filter == 'yearly':
                    key = dt.strftime('%Y')
                else: # monthly
                    key = dt.strftime('%Y-%m')
                    
                amount = float(sale.get('grandTotal', sale.get('totalPrice', 0)))
                chart_data[key] += amount
            except Exception as e:
                pass
                
        sorted_keys = sorted(chart_data.keys())
        labels = sorted_keys
        data = [chart_data[k] for k in sorted_keys]
        
        return jsonify({
            'labels': labels,
            'data': data
        }), 200
    except Exception as e:
        logger.error(f"Error fetching chart data: {e}")
        return jsonify({"error": str(e)}), 500

"""
    # Insert right before "if __name__ == '__main__':"
    if "if __name__ == '__main__':" in content:
        new_content = content.replace("if __name__ == '__main__':", dashboard_endpoints + "\nif __name__ == '__main__':")
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Successfully added endpoints.")
    else:
        print("Could not find '__main__'.")

if __name__ == "__main__":
    append_to_file()

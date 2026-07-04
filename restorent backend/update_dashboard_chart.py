import re

def update_backend():
    target_file = r"c:\manoj\backend\restaurant-pos-backend\app1.py"
    with open(target_file, "r", encoding="utf-8") as f:
        content = f.read()

    new_chart_data = """@app.route('/api/admin-dashboard/chart-data', methods=['GET'])
def admin_dashboard_chart_data():
    try:
        company = request.args.get('company')
        branch = request.args.get('branch')
        date_filter = request.args.get('date_filter', 'monthly') # daily, monthly, yearly, custom
        metric_type = request.args.get('metric_type', 'sales') # sales, customers, items, employees
        
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        query = {}
        if company and company != 'All':
            query['company_name'] = company
            if branch and branch != 'All Branches':
                query['branch_name'] = branch
                
        query2 = {}
        if company and company != 'All':
            query2['company'] = company
            if branch and branch != 'All Branches':
                query2['branch'] = branch
                
        from collections import defaultdict
        from datetime import datetime
        
        chart_data = defaultdict(float)
        
        # Determine which collection to query based on metric_type
        docs = []
        if metric_type == 'sales':
            d1 = list(sales_collection.find(query, {'timestamp': 1, 'date': 1, 'created_at': 1, 'grand_total': 1, 'total': 1}))
            d2 = list(sales_collection.find(query2, {'timestamp': 1, 'date': 1, 'created_at': 1, 'grand_total': 1, 'total': 1}))
            d_all = {str(d.get('_id', id(d))): d for d in d1 + d2}
            docs = list(d_all.values())
        elif metric_type == 'customers':
            d1 = list(customers_collection.find(query, {'created_at': 1, 'date': 1}))
            d2 = list(customers_collection.find(query2, {'created_at': 1, 'date': 1}))
            d_all = {str(d.get('_id', id(d))): d for d in d1 + d2}
            docs = list(d_all.values())
        elif metric_type == 'employees':
            d1 = list(worker_collection.find(query, {'created_at': 1, 'dateOfJoining': 1}))
            d2 = list(worker_collection.find(query2, {'created_at': 1, 'dateOfJoining': 1}))
            d_all = {str(d.get('_id', id(d))): d for d in d1 + d2}
            docs = list(d_all.values())
        elif metric_type == 'items':
            d1 = list(items_collection.find(query, {'created_at': 1}))
            d2 = list(items_collection.find(query2, {'created_at': 1}))
            d_all = {str(d.get('_id', id(d))): d for d in d1 + d2}
            docs = list(d_all.values())
            
        start_dt = None
        end_dt = None
        if date_filter == 'custom' and start_date_str and end_date_str:
            try:
                start_dt = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0)
                end_dt = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
            except:
                pass
        
        for doc in docs:
            # Fallback multiple date fields
            date_val = doc.get('timestamp') or doc.get('created_at') or doc.get('date') or doc.get('dateOfJoining')
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
                    
                # Custom Date Filtering
                if start_dt and end_dt:
                    # Strip timezone for comparison if needed
                    dt_naive = dt.replace(tzinfo=None)
                    if not (start_dt <= dt_naive <= end_dt):
                        continue
                
                # Format Key based on filter
                if date_filter == 'daily' or date_filter == 'custom':
                    key = dt.strftime('%Y-%m-%d')
                elif date_filter == 'yearly':
                    key = dt.strftime('%Y')
                else: # monthly
                    key = dt.strftime('%Y-%m')
                    
                if metric_type == 'sales':
                    amount = float(doc.get('grand_total', doc.get('total', 0)))
                    chart_data[key] += amount
                else:
                    chart_data[key] += 1
                    
            except Exception as e:
                pass
                
        sorted_keys = sorted(chart_data.keys())
        labels = sorted_keys
        data = [chart_data[k] for k in sorted_keys]
        
        return jsonify({
            'labels': labels,
            'data': data,
            'metric': metric_type
        }), 200
    except Exception as e:
        logger.error(f"Error fetching chart data: {e}")
        return jsonify({"error": str(e)}), 500"""

    pattern = re.compile(r"@app\.route\('/api/admin-dashboard/chart-data', methods=\['GET'\]\)\ndef admin_dashboard_chart_data\(\):.*?return jsonify\(\{\"error\": str\(e\)\}\), 500", re.DOTALL)
    
    if pattern.search(content):
        new_content = pattern.sub(new_chart_data, content)
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Updated chart data API successfully.")
    else:
        print("Pattern not found!")

if __name__ == "__main__":
    update_backend()

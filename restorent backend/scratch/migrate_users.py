import sqlite3
import json

def migrate():
    conn = sqlite3.connect('restaurant.db')
    cursor = conn.cursor()
    
    # Fetch all employees
    cursor.execute('SELECT * FROM new_employee')
    employees = cursor.fetchall()
    
    for e_id, e_data in employees:
        try:
            data = json.loads(e_data)
            emp_id = data.get('employeeId')
            email = str(data.get('email', '')).strip().lower()
            company = str(data.get('company', '')).strip().lower()
            
            if not email:
                continue
            
            # Fetch all users
            cursor.execute('SELECT * FROM users')
            users = cursor.fetchall()
            
            for u_id, u_data in users:
                u_json = json.loads(u_data)
                u_email = str(u_json.get('email', '')).strip().lower()
                u_comp = str(u_json.get('company', '')).strip().lower()
                
                if u_email == email:
                    print(f"Match found for {email}. User Comp: {u_comp}, Emp Comp: {company}")
                    # Flexible company match
                    if u_comp == company or company in u_comp or u_comp in company or not u_comp:
                        u_json['employeeId'] = emp_id
                        u_json['worker_id'] = e_id
                        cursor.execute('UPDATE users SET data=? WHERE id=?', (json.dumps(u_json), u_id))
                        print(f"Fixed user: {email} ({emp_id})")
        except Exception as e:
            print(f"Error processing {e_id}: {e}")
            
    conn.commit()
    conn.close()

if __name__ == '__main__':
    migrate()

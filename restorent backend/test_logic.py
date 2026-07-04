from app1 import get_hierarchical_users, get_own_identifiers, app

with app.app_context():
    # Nisam user ID
    nisam_id = '75948cb7-cffe-4106-ab09-8dc8906beacd'
    print("=== NISAM OWN ===")
    ids, emails, names = get_own_identifiers(nisam_id)
    print("IDs:", ids)
    print("Emails:", emails)
    print("Names:", names)

    # Manoj user ID
    manoj_id = 'd83416f0-477f-4550-961a-ad8be95b50c1'
    print("\n=== MANOJ HIERARCHY ===")
    # Simulate active_company manually since it's normally resolved from request context
    ids, emails, names = get_hierarchical_users(manoj_id, 'BearerHead')
    print("IDs:", ids)
    print("Emails:", emails)
    print("Names:", names)

from app1 import allow_access

# Test 1: BearerHead in KYLE1 (Company level)
can_access, access_type = allow_access('leave_apply', active_company='KYLE1', active_branch='All')
print(f"Test 1 (Company Level): can_access={can_access}, access_type={access_type}")

# Test 2: BearerHead in KYLE1(BR) (Branch level - should be NEW/False)
can_access, access_type = allow_access('leave_apply', active_company='KYLE1', active_branch='KYLE1(BR)')
print(f"Test 2 (Branch Level): can_access={can_access}, access_type={access_type}")


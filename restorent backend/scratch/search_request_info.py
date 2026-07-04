with open("app1.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching app1.py for get_request_user_info:")
for i, line in enumerate(lines):
    if "get_request_user_info" in line:
        print(f"Line {i+1}: {line.strip()[:100]}")

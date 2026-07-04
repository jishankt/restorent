with open("app1.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching allow_access in app1.py:")
for i, line in enumerate(lines):
    if "def allow_access" in line:
        print(f"Line {i+1}: {line.strip()[:100]}")

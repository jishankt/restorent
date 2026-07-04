with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\Addemployee.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching Addemployee.jsx for ID generation or fields:")
for i, line in enumerate(lines):
    if "employeeid" in line.lower() or "employee_id" in line.lower() or "generate" in line.lower() or "co" in line:
        if i + 1 < 1000:
            print(f"Line {i+1}: {line.strip()[:100]}")

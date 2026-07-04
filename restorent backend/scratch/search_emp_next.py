with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\Addemployee.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching Addemployee.jsx for next employee ID:")
for i, line in enumerate(lines):
    if "next-employee-id" in line.lower() or "nextid" in line.lower():
        print(f"Line {i+1}: {line.strip()[:120]}")

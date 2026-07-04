with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\employeelist.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching employeelist.jsx:")
for i, line in enumerate(lines):
    if "role" in line.lower() or "designation" in line.lower() or "permission" in line.lower():
        if i + 1 < 1000:
            print(f"Line {i+1}: {line.strip()[:100]}")

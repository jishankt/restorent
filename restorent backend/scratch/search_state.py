with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\CreateItemsPage.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching state declarations:")
for i, line in enumerate(lines):
    if "branchprices" in line.lower() or "companyprices" in line.lower():
        print(f"Line {i+1}: {line.strip()[:120]}")

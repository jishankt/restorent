with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\CreateItemsPage.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching JSX rendering block:")
for i, line in enumerate(lines):
    if "input" in line.lower() and "price_list_rate" in line:
        print(f"Line {i+1}: {line.strip()[:120]}")
    if "getFieldLabel" in line:
        if i + 1 > 3500 and i + 1 < 3700:
            print(f"Line {i+1}: {line.strip()[:120]}")

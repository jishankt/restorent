with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\CreateItemsPage.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching input field for price_list_rate:")
for i, line in enumerate(lines):
    if "price_list_rate" in line:
        if "input" in line.lower() or "onChange" in line or "<label" in line or "value=" in line:
            print(f"Line {i+1}: {line.strip()[:120]}")

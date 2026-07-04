with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\CreateItemsPage.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching Price * label:")
for i, line in enumerate(lines):
    if "Price *" in line or "price_list_rate" in line:
        print(f"Line {i+1}: {line.strip()[:120]}")

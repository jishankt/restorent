with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\CreateItemsPage.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching input change handler:")
for i, line in enumerate(lines):
    if "onchange" in line.lower() or "handleinputchange" in line.lower() or "handlefieldchange" in line.lower():
        if i + 1 > 100 and i + 1 < 1000:
            print(f"Line {i+1}: {line.strip()[:120]}")

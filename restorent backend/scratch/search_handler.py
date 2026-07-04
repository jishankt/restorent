with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\CreateItemsPage.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching input change handler:")
for i, line in enumerate(lines):
    if "const handleChange" in line or "const handleInputChange" in line or "handleFieldChange" in line or "onFieldChange" in line:
        print(f"Line {i+1}: {line.strip()[:120]}")

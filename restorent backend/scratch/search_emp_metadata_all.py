with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\Addemployee.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching metadata in Addemployee.jsx:")
for i, line in enumerate(lines):
    if "metadata =" in line or "const metadata" in line or "fields:" in line:
        print(f"Line {i+1}: {line.strip()[:100]}")

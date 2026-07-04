with open(r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\Addemployee.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching metadata in Addemployee.jsx:")
found = False
for i, line in enumerate(lines):
    if "metadata =" in line or "const metadata" in line or "fields:" in line:
        found = True
    if found:
        if i + 1 > 50 and i + 1 < 300: # Usually near the top of the file
            print(f"Line {i+1}: {line.strip()[:100]}")

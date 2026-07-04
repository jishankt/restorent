import re

file_path = r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\CreateItemsPage.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print("File loaded. Total lines:", len(lines))
keywords = ["price", "rate", "branch_prices", "company_prices", "price_list_rate"]

for i, line in enumerate(lines):
    for kw in keywords:
        if kw in line.lower():
            # Print matching lines with line numbers (1-indexed)
            if i + 1 > 2000 and i + 1 < 3000: # Narrow down around lines 2000-3000
                print(f"Line {i+1}: {line.strip()[:120]}")
                break

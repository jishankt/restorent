
import sys

def delete_lines(file_path, start_line, end_line):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Lines are 1-indexed, so start_line 1556 is index 1555
    new_lines = lines[:start_line-1] + lines[end_line:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    delete_lines(r'c:\manoj\webrestaurant\frontend\restaurant-pos-FE\src\components\Form\CustomerListPage.jsx', 1556, 2106)

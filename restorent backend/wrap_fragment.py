import re

file_path = r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\Purchase.jsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the first `return (\n    <div style={{` inside the main Purchase component.
# It starts around line 3597.
# We want to replace it with `return (\n    <>\n    <div style={{`
# We can find the exact match:
target_start = """  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'transparent',
      padding: '20px',
      position: 'relative'
    }}>"""

replacement_start = """  return (
    <>
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'transparent',
      padding: '20px',
      position: 'relative'
    }}>"""

content = content.replace(target_start, replacement_start)

# Now we need to append `</>` before the final `);`
# The end of the file is:
#       />
#     </div>
#   );
# }
# export default Purchase;

target_end = """    </div>
  );
}
export default Purchase;"""

replacement_end = """    </div>
    </>
  );
}
export default Purchase;"""

content = content.replace(target_end, replacement_end)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Purchase.jsx wrapped in fragment.")

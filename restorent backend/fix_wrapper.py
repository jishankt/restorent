import re

file_path = r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\Purchase.jsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I will find the wrapper start and remove it.
wrapper_start = """          {/* NEW: Standardized Multi-Company and Adaptive Branch Selection Grid */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '25px',
            // boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            marginBottom: '30px',
            marginTop: '60px'
          }}>"""

if wrapper_start in content:
    content = content.replace(wrapper_start, "          {/* NEW: Fixed Top Navbar Filter */}")
    
    # We also need to remove its corresponding closing </div>.
    # We know the fixed navbar ends near line 3803 with </div>. Then there's an extra </div> after it which belonged to the wrapper.
    # Let's search for this sequence to safely remove the extra </div>:
    
    sequence_to_fix = """        )}
      </div>
    </div>
          {activeTab === 'landing' ? ("""
    
    if sequence_to_fix in content:
         content = content.replace(sequence_to_fix, """        )}
      </div>
          {activeTab === 'landing' ? (""")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Wrapper fixed.")

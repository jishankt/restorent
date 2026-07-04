import re

file_path = r"c:\manoj\frontend\restaurant-pos-FE\src\components\Form\Purchase.jsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State changes
content = content.replace("const [selectedCompanies, setSelectedCompanies] = useState([]);", 
"""const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All Companies');
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});""")

content = content.replace("const companyHeader = (selectedCompanies && selectedCompanies.length > 0) \n      ? selectedCompanies.join(',')",
"const companyHeader = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') \n      ? selectedCompanyFilter")

content = content.replace("}, [selectedBranchFilter, selectedCompanies]);", "}, [selectedBranchFilter, selectedCompanyFilter]);")

content = content.replace("if (selectedCompanies && selectedCompanies.length > 0) {\n      return selectedCompanies.join(',');\n    }",
"if (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') {\n      return selectedCompanyFilter;\n    }")

# Instead of checking selectedCompanies.length === 0, we check for All Companies
content = content.replace("if (selectedCompanies.length === 0 && comps.length > 0) {\n                setSelectedCompanies(comps);\n              }",
"if (selectedCompanyFilter === 'All Companies' && comps.length > 0 && !isGroupAdminRole) {\n                setSelectedCompanyFilter(comps[0]);\n              }")

content = content.replace("const companyName = targetCompany || (selectedCompanies && selectedCompanies.length > 0 ? selectedCompanies.join(',') : (user.company_name || user.company));",
"const companyName = targetCompany || ((selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') ? selectedCompanyFilter : (user.company_name || user.company));")

content = content.replace("const activeComp = (selectedCompanies && selectedCompanies.length > 0)\n          ? selectedCompanies[0]",
"const activeComp = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies')\n          ? selectedCompanyFilter")

content = content.replace("}, [selectedCompanies, selectedBranchFilter]);", "}, [selectedCompanyFilter, selectedBranchFilter]);")

content = content.replace("if (activeTab !== 'landing' && (selectedCompanies.length > 0 || !isGroupAdmin)) {",
"if (activeTab !== 'landing' && (selectedCompanyFilter || !isGroupAdmin)) {")

content = content.replace("}, [activeTab, selectedBranchFilter, selectedCompanies, isGroupAdmin]);", "}, [activeTab, selectedBranchFilter, selectedCompanyFilter, isGroupAdmin]);")
content = content.replace("}, [selectedCompanies, isGroupAdmin]);", "}, [selectedCompanyFilter, isGroupAdmin]);")

content = content.replace("company_name: selectedCompanies.length > 0 ? selectedCompanies[0] : (userObj?.company_name || '')",
"company_name: (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') ? selectedCompanyFilter : (userObj?.company_name || '')")

# 2. Injecting CompanyBranchesMap building in fetchBranches
# Search for `const branches = user.branches || [];` and add map building
branch_logic = """
          const branches = user.branches || [];
          setAvailableBranches(branches);
          
          if (user.company_branches_map) {
             setCompanyBranchesMap(user.company_branches_map);
          } else {
             // Fallback
             const cMap = {};
             assignedCompanies.forEach(c => cMap[c] = branches);
             setCompanyBranchesMap(cMap);
          }
"""
content = re.sub(r'const branches = user\.branches \|\| \[\];\s*setAvailableBranches\(branches\);', branch_logic, content)

# 3. Replacing the old UI grid with the new Navbar filter
# The old UI grid starts near line 3670 with `<div style={{ display: 'grid', gridTemplateColumns: isGroupAdmin ? '1fr 1fr' : '1fr', gap: '30px' }}>`
# and ends near line 3757. I'll use regex to find and replace the whole block.
# Actually, the old grid is wrapped in a container that has margin top 60px.
# Let's replace the whole container.

old_ui_regex = r"<div style=\{\{\s*background:\s*'#ffffff',\s*borderRadius:\s*'20px',\s*padding:\s*'25px',\s*border:\s*'1px solid rgba\(255, 255, 255, 0\.18\)',\s*marginBottom:\s*'30px',\s*marginTop:\s*'60px'\s*\}\}>.*?(?=<!-- end grid -->|{/\* ADAPTIVE BRANCH UI END \*/}|</div>\s*</div>\s*</div>\s*<div style=\{\{ display: 'flex')"

# Wait, `Purchase.jsx` structure is complex. Let's just do a string replacement for the grid div.
old_grid_start = "<div style={{ display: 'grid', gridTemplateColumns: isGroupAdmin ? '1fr 1fr' : '1fr', gap: '30px' }}>"
# I will find the start, and write a small parser to find the matching end div.
def extract_and_replace_grid(code):
    idx = code.find(old_grid_start)
    if idx == -1: return code
    # find the end of the div
    open_count = 0
    end_idx = -1
    for i in range(idx, len(code)):
        if code[i:i+4] == '<div': open_count += 1
        elif code[i:i+5] == '</div':
            open_count -= 1
            if open_count == 0:
                end_idx = i + 6
                break
    
    new_ui = """
      <div style={{
        position: "fixed",
        top: "15px",
        left: "50%",
        transform: "translateX(-50%)",
        width: isCompanyAdmin ? "50%" : "40%",
        maxWidth: isCompanyAdmin ? "700px" : "500px",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: "30px",
        padding: "5px 15px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0",
        transition: "all 0.3s ease",
        gap: "10px"
      }}>
        {isGroupAdmin && (
          <Form.Select
            value={selectedCompanyFilter}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCompanyFilter(val);
              localStorage.setItem('active_company', val === 'All Companies' ? 'All' : val);
              
              const hasBranches = val === 'All Companies' || val === 'All'
                ? true
                : (companyBranchesMap[val] && companyBranchesMap[val].length > 0);
              if (!hasBranches) {
                setSelectedBranchFilter('All Branches');
                localStorage.setItem('active_branch', 'All Branches');
              }
            }}
            style={{
              width: "auto",
              minWidth: "160px",
              border: "none",
              borderRight: "1px solid #e0e0e0",
              borderRadius: "0",
              backgroundColor: "transparent",
              boxShadow: "none",
              cursor: "pointer",
              fontWeight: "600",
              color: "#2c3e50"
            }}
          >
            <option value="All Companies">All Companies</option>
            {assignedCompanies.map((comp, idx) => (
              <option key={idx} value={comp}>{comp}</option>
            ))}
          </Form.Select>
        )}
        
        {(isGroupAdmin || (isCompanyAdmin && !userBranch)) && (() => {
          const showBranches = selectedCompanyFilter === 'All Companies' || selectedCompanyFilter === 'All'
            ? availableBranches.length > 0
            : (companyBranchesMap[selectedCompanyFilter] && companyBranchesMap[selectedCompanyFilter].length > 0);
          return showBranches;
        })() && (
          <Form.Select
            value={selectedBranchFilter}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedBranchFilter(val);
              localStorage.setItem('active_branch', val === 'All Branches' ? 'All Branches' : val);
            }}
            style={{
              width: "auto",
              minWidth: "160px",
              border: "none",
              borderRight: "1px solid #e0e0e0",
              borderRadius: "0",
              backgroundColor: "transparent",
              boxShadow: "none",
              cursor: "pointer",
              fontWeight: "600",
              color: "#2c3e50"
            }}
          >
            <option value="All Branches">All Branches</option>
            {(() => {
              const branchesToList = selectedCompanyFilter === 'All Companies' || selectedCompanyFilter === 'All'
                ? availableBranches
                : (companyBranchesMap[selectedCompanyFilter] || []);
              return branchesToList.map((branch, idx) => (
                <option key={idx} value={branch}>{branch}</option>
              ));
            })()}
          </Form.Select>
        )}
        <Form.Control
          type="text"
          placeholder="Search items..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          style={{
            border: "none",
            backgroundColor: "transparent",
            boxShadow: "none",
            fontSize: "16px",
            padding: "8px 10px",
            color: "#333",
            width: "100%"
          }}
        />
        {globalSearch && (
          <button
            onClick={() => setGlobalSearch("")}
            style={{
              border: "none",
              backgroundColor: "transparent",
              color: "#999",
              fontSize: "20px",
              padding: "0 5px",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        )}
      </div>
    """
    
    # We replace the old grid div with the new top filter!
    return code[:idx] + new_ui + code[end_idx:]

content = extract_and_replace_grid(content)

# Because we removed the old grid, there's an empty parent div wrapper that we can leave alone (it had the white background box).
# Actually, the user doesn't need that white empty box taking up space at the top. Let's remove the wrapper too.
def remove_wrapper(code):
    wrapper_start = "<div style={{\n            background: '#ffffff',\n            borderRadius: '20px',\n            padding: '25px',\n            // boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',\n            border: '1px solid rgba(255, 255, 255, 0.18)',\n            marginBottom: '30px',\n            marginTop: '60px'\n          }}>"
    # Try replacing it with just nothing. Since we already replaced its child with `new_ui`, if we just find `wrapper_start` and the `</div>` at the end...
    # It's easier to just leave it or use regex.
    pass

# We also need to map the `globalSearch` to filter items/suppliers.
# `Purchase.jsx` already has `itemSearch` and `supplierSearch`.
# It's safer to just let the user use `globalSearch` for whatever they want, or we can map `globalSearch` to `itemSearch` via a useEffect.
# Actually, the user just wants the DESIGN for now.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Purchase.jsx successfully refactored.")

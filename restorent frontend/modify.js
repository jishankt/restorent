const fs = require('fs');
const path = 'C:\\manoj\\frontend\\restaurant-pos-FE\\src\\components\\Form\\CreateItemsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
content = content.replace(
    'import "./CreateItemPage.css";',
    'import "./CreateItemPage.css";\nimport CustomerCustomizationModal from "./CustomerCustomizationModal";'
);

// 2. Remove CustomizeDropdown definition
const startStr = 'const CustomizeDropdown = ({';
const endStr = 'const CreateItemPage = () => {';
const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);
if (startIdx !== -1 && endIdx !== -1) {
    content = content.slice(0, startIdx) + content.slice(endIdx);
}

// 3. Add state
content = content.replace(
    'const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);',
    'const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);\n  const [showCustomizeModal, setShowCustomizeModal] = useState(false);'
);

// 4. Replace CustomizeDropdown usage
const buttonUsage = `<button 
                type="button"
                className="add-button" 
                onClick={() => setShowCustomizeModal(true)}
                style={{ backgroundColor: 'rgb(46, 204, 113)' }}
              >
                <FaCogs style={{ marginRight: '5px' }} /> Customize Fields
              </button>`;
content = content.replace(/<CustomizeDropdown[^>]+>/s, buttonUsage);

// 5. Add Modal at the end
const finalEndStr = content.match(/<\/[M]odal>\s*<\/[d]iv>\s*\);\s*};\s*export default CreateItemPage;/s);
if (finalEndStr) {
    const customModalStr = `      </Modal>

      <CustomerCustomizationModal 
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onRefresh={() => fetchDoctype(baseUrl || "")}
        targetDocType="Item"
      />
    </div>
  );
};
export default CreateItemPage;`;
    content = content.replace(finalEndStr[0], customModalStr);
} else {
    console.log("Could not find the end of the file regex match");
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done modifying CreateItemsPage.jsx');

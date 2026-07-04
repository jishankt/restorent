const fs = require('fs');
let code = fs.readFileSync('src/components/Form/CreateItemsPage.jsx', 'utf8');

const replacement = `  const displaySymbol = (() => {
      let targetComp = (selectedCompanies && selectedCompanies.length > 0) ? selectedCompanies[0] : null;
      let targetBranch = (branchNames && branchNames.length > 0) ? branchNames[0] : null;
      
      if (targetComp || targetBranch) {
          if (currencyMap && currencyMap.get) {
             const settings = currencyMap.get(targetComp, targetBranch);
             const curr = settings.currency || currency || "INR";
             const useSym = settings.useCurrencySymbol !== undefined ? settings.useCurrencySymbol : useCurrencySymbol;
             return useSym ? getCurrencySymbol(curr) : \`\${curr} \`;
          }
      }
      return useCurrencySymbol ? getCurrencySymbol(currency) : \`\${currency} \`;
  })();`;

code = code.replace(/const displaySymbol = useCurrencySymbol \? getCurrencySymbol\(currency\) : `\$\{currency\} `;/, replacement);
fs.writeFileSync('src/components/Form/CreateItemsPage.jsx', code);
console.log('Dynamic displaySymbol updated successfully');

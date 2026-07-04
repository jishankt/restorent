const fs = require('fs');
let code = fs.readFileSync('src/components/Form/CreateItemsPage.jsx', 'utf8');

const newStateBlock = `  const [currency, setCurrency] = useState("INR");
  const [useCurrencySymbol, setUseCurrencySymbol] = useState(false);
  const [currencyMap, setCurrencyMap] = useState(null);

  const getCurrencySymbol = (currCode) => {
    const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", JPY: "¥", CNY: "¥", SGD: "$", MYR: "RM", THB: "฿", IDR: "Rp", KRW: "₩", PHP: "₱", SAR: "﷼", QAR: "﷼", KWD: "د.ك", OMR: "﷼", BHD: ".د.ب", CAD: "$", AUD: "$", NZD: "$", CHF: "CHF", ZAR: "R", BRL: "R$", PKR: "₨", LKR: "Rs", NGN: "₦" };
    return symbols[currCode?.toUpperCase()] || '₹';
  };

  const displaySymbol = useCurrencySymbol ? getCurrencySymbol(currency) : \`\${currency} \`;

  const getCompanyDisplaySymbol = (compName, branchName) => {
      if (currencyMap && currencyMap.get) {
         const settings = currencyMap.get(compName, branchName);
         const curr = settings.currency || "INR";
         const useSym = settings.useCurrencySymbol || false;
         return useSym ? getCurrencySymbol(curr) : \`\${curr} \`;
      }
      return displaySymbol;
  };

  useEffect(() => {
    if (!configLoading) {
      const fetchCurrency = async () => {
        try {
          // Fetch all settings for dynamic company overrides
          const listApiPath = baseUrl ? \`\${baseUrl}/api/settings/list\` : '/api/settings/list';
          const listResponse = await axios.get(listApiPath, { headers: getHeaders() });
          
          const newMap = {};
          let globalSettings = null;

          if (listResponse.data && Array.isArray(listResponse.data)) {
            listResponse.data.forEach(setting => {
               if (setting._id === "system_settings") {
                 globalSettings = setting;
               } else {
                 newMap[setting._id] = setting;
               }
            });
          }

          const getSettingsFor = (comp, branch) => {
             const c_norm = (comp || '').toLowerCase().replace(/\\s/g, '');
             const b_norm = (branch || '').toLowerCase().replace(/\\s/g, '');
             if (c_norm && b_norm && newMap[\`system_settings_\${c_norm}_\${b_norm}\`]) {
               return newMap[\`system_settings_\${c_norm}_\${b_norm}\`];
             }
             if (c_norm && newMap[\`system_settings_\${c_norm}\`]) {
               return newMap[\`system_settings_\${c_norm}\`];
             }
             return globalSettings || {};
          };

          setCurrencyMap({ get: getSettingsFor });

          // Fetch active context settings
          const apiPath = baseUrl ? \`\${baseUrl}/api/settings\` : '/api/settings';
          const response = await axios.get(apiPath, { headers: getHeaders() });
          const { currency: fetchedCurrency, useCurrencySymbol: fetchedUseSymbol = false } = response.data || {};
          
          setCurrency((fetchedCurrency || "INR").toUpperCase());
          setUseCurrencySymbol(fetchedUseSymbol);
        } catch (error) {
          setCurrency("INR");
        }
      };
      fetchCurrency();
    }
  }, [baseUrl, configLoading]);`;

if (code.includes('const [currencyMap, setCurrencyMap]')) {
   console.log('Already updated');
} else {
   const startIdx = code.indexOf('const [currency, setCurrency] = useState("INR");');
   const endIdx = code.indexOf('const fetchDoctype = async');
   if (startIdx !== -1 && endIdx !== -1) {
       code = code.substring(0, startIdx) + newStateBlock + '\n\n  ' + code.substring(endIdx);
       
       // Now replace occurrences of `displaySymbol` with `getCompanyDisplaySymbol(comp)` where applicable.
       // In the company options map:
       // "Price Override ({displaySymbol})" inside `companyOptions.map((comp, idx)`
       code = code.replace(/Price Override \(\{displaySymbol\}\)/g, 'Price Override ({getCompanyDisplaySymbol(comp)})');
       
       fs.writeFileSync('src/components/Form/CreateItemsPage.jsx', code);
       console.log('Successfully injected advanced currency logic.');
   } else {
       console.log('Could not find injection boundaries.');
   }
}

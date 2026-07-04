const fs = require('fs');

let code = fs.readFileSync('src/components/Form/CreateItemsPage.jsx', 'utf8');

// Replacements
code = code.replace(/\(₹\)/g, '({displaySymbol})');
code = code.replace(/₹\$\{/g, '${displaySymbol}${');
code = code.replace(/>₹\{/g, '>{displaySymbol}{');
code = code.replace(/"₹0"/g, '`${displaySymbol}0`');

const stateInjection = `
  const [currency, setCurrency] = useState("INR");
  const [useCurrencySymbol, setUseCurrencySymbol] = useState(false);

  const getCurrencySymbol = (currCode) => {
    const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", JPY: "¥", CNY: "¥", SGD: "$", MYR: "RM", THB: "฿", IDR: "Rp", KRW: "₩", PHP: "₱", SAR: "﷼", QAR: "﷼", KWD: "د.ك", OMR: "﷼", BHD: ".د.ب", CAD: "$", AUD: "$", NZD: "$", CHF: "CHF", ZAR: "R", BRL: "R$", PKR: "₨", LKR: "Rs", NGN: "₦" };
    return symbols[currCode?.toUpperCase()] || '₹';
  };

  const displaySymbol = useCurrencySymbol ? getCurrencySymbol(currency) : \`\${currency} \`;

  useEffect(() => {
    if (!configLoading) {
      const fetchCurrency = async () => {
        try {
          const apiPath = baseUrl ? \`\${baseUrl}/api/settings\` : '/api/settings';
          const response = await axios.get(apiPath);
          const { currency: fetchedCurrency = "INR", useCurrencySymbol: fetchedUseSymbol = false } = response.data;
          setCurrency(fetchedCurrency.toUpperCase());
          setUseCurrencySymbol(fetchedUseSymbol);
        } catch (error) {
          setCurrency("INR");
        }
      };
      fetchCurrency();
    }
  }, [baseUrl, configLoading]);
`;

code = code.replace(
  /(const \[userCompany, setUserCompany\].*?\n\s+return "";\n\s+\}\);\n)/s,
  `$1\n${stateInjection}\n`
);

fs.writeFileSync('src/components/Form/CreateItemsPage.jsx', code);
console.log("Replaced currency symbols.");

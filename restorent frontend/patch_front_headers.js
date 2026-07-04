const fs = require('fs');
let code = fs.readFileSync('src/components/Header/Front.jsx', 'utf8');

// Inject getHeaders into UserContext destructing
code = code.replace(/const \{ baseUrl, configLoading \} = useContext\(UserContext\);/, 'const { baseUrl, configLoading, getHeaders } = useContext(UserContext);');

// Replacements for axios.get
code = code.replace(/axios\.get\((apiPath|apiUrl|notifUrl|permUrl)\)/g, 'axios.get($1, { headers: getHeaders() })');
code = code.replace(/axios\.get\(`\$\{apiBase\}\/api\/settings`\)/g, 'axios.get(`${apiBase}/api/settings`, { headers: getHeaders() })');
code = code.replace(/axios\.get\(`\$\{apiBase\}\/api\/company-details`\)/g, 'axios.get(`${apiBase}/api/company-details`, { headers: getHeaders() })');
code = code.replace(/axios\.get\(`\$\{baseUrl\}\/api\/tables`\)/g, 'axios.get(`${baseUrl}/api/tables`, { headers: getHeaders() })');
code = code.replace(/axios\.get\('\/api\/module-visibility', \{ params \}\)/g, "axios.get('/api/module-visibility', { params, headers: getHeaders() })");
code = code.replace(/axios\.get\('\/api\/workflow-visibility', \{ params \}\)/g, "axios.get('/api/workflow-visibility', { params, headers: getHeaders() })");
code = code.replace(/axios\.get\(`\$\{baseUrl\}\/api\/items`\)/g, 'axios.get(`${baseUrl}/api/items`, { headers: getHeaders() })');
code = code.replace(/axios\.get\(`\$\{baseUrl\}\/api\/combo-offer`\)/g, 'axios.get(`${baseUrl}/api/combo-offer`, { headers: getHeaders() })');

// Replacements for axios.post and axios.put
code = code.replace(/axios\.post\(`\$\{baseUrl\}\/api\/add-address-value`, payload\)/g, 'axios.post(`${baseUrl}/api/add-address-value`, payload, { headers: getHeaders() })');
code = code.replace(/axios\.put\(apiPath, \{ paid: true, cartItems: billCartItems \}\)/g, 'axios.put(apiPath, { paid: true, cartItems: billCartItems }, { headers: getHeaders() })');
code = code.replace(/axios\.post\(apiPath, payload\)/g, 'axios.post(apiPath, payload, { headers: getHeaders() })');
code = code.replace(/axios\.post\(apiPath, customerData\)/g, 'axios.post(apiPath, customerData, { headers: getHeaders() })');
code = code.replace(/axios\.put\(apiPath, customerData\)/g, 'axios.put(apiPath, customerData, { headers: getHeaders() })');
code = code.replace(/axios\.post\(apiPath, \{ group_name: newGroupName\.trim\(\) \}\)/g, 'axios.post(apiPath, { group_name: newGroupName.trim() }, { headers: getHeaders() })');
code = code.replace(/axios\.post\(apiPathKitchen, newOrder\)/g, 'axios.post(apiPathKitchen, newOrder, { headers: getHeaders() })');
code = code.replace(/axios\.put\(apiPathUpdate, newOrder\)/g, 'axios.put(apiPathUpdate, newOrder, { headers: getHeaders() })');
code = code.replace(/axios\.post\(apiPathSave, newOrder\)/g, 'axios.post(apiPathSave, newOrder, { headers: getHeaders() })');

fs.writeFileSync('src/components/Header/Front.jsx', code);
console.log('Front.jsx patched successfully');

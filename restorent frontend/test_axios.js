
const axios = require('axios');
async function run() {
  const comp = 'Hot Burger UAE LLC';
  const url = 'http://127.0.0.1:6034/api/branches?company_name=' + encodeURIComponent(comp);
  try {
    const res = await axios.get(url, { headers: { 'X-Company-Name': comp } });
    console.log(res.data);
  } catch (e) {
    console.log('Error', e.message);
  }
}
run();


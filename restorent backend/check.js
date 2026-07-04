const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/manoj/backend/restaurant-pos-backend/restaurant.db');
db.all('SELECT * FROM collections WHERE collection_name="kitchens"', (err, rows) => {
  if (err) throw err;
  console.log("KITCHENS:");
  console.log(rows.map(r => JSON.parse(r.document).branch_name));
  db.close();
});

const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5001/api/reports/class/KG 3?term=First Term');
    console.log("Success! Reports count:", res.data.data.reports.length);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

test();

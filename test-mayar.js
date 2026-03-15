const https = require('https');
const fs = require('fs');
const path = require('path');

// Basic .env.local parser
function getApiKey() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/MAYAR_API_KEY=(.*)/);
    return match ? match[1].trim().replace(/['"]/g, '') : null;
  } catch (e) {
    return null;
  }
}

const apiKey = getApiKey();
const randomId = Math.random().toString(36).substring(2, 12).toUpperCase();

const payload = JSON.stringify({
  name: `ISOLATED_TEST_${randomId}`,
  amount: 10000,
  description: `Testing from isolated script: ${randomId}`,
  customer_name: "Test Donor",
  email: `test-${randomId}@example.com`,
  mobile: "081234567890",
  redirect_url: "https://example.com"
});

console.log("--- STARTING ISOLATED HTTPS TEST ---");
console.log("Payload:", payload);
console.log("API Key found:", !!apiKey);

const options = {
  hostname: 'api.mayar.id',
  port: 443,
  path: '/hl/v1/payment/create',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response Body:', body);
    console.log("--- TEST COMPLETE ---");
    if (res.statusCode === 409) {
        console.log("\n!!! RESULT: 409 CONFLICT DETECTED IN ISOLATED ENVIRONMENT !!!");
        console.log("This means the issue is strictly API/Account level.");
    }
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
});

req.write(payload);
req.end();

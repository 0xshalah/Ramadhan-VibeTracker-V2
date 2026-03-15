const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/sync',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer FAKE_STRESS_TOKEN'
    }
};

let completed = 0;
const total = 50;
const start = Date.now();

console.log(`Starting stress test: ${total} requests to /api/auth/sync...`);

for (let i = 0; i < total; i++) {
    const req = http.request(options, (res) => {
        completed++;
        if (completed === total) {
            const end = Date.now();
            console.log(`Finished ${total} requests in ${end - start}ms`);
            console.log(`Average: ${(end - start) / total}ms per request`);
        }
    });

    req.on('error', (e) => {
        console.error(`Request ${i} failed: ${e.message}`);
        completed++;
    });

    req.write(JSON.stringify({ displayName: 'Stress Test', photoURL: '' }));
    req.end();
}

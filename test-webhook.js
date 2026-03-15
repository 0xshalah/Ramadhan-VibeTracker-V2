const crypto = require('crypto');
// Load dotenv to get the secret easily
require('dotenv').config({ path: '.env.local' });

const SECRET = process.env.MAYAR_WEBHOOK_SECRET;

if (!SECRET) {
  console.error("❌ MAYAR_WEBHOOK_SECRET tidak ditemukan di .env.local!");
  process.exit(1);
}

const payload = {
  status: "SUCCESS",
  data: {
    id: `TRX-MOCK-${Math.floor(Math.random() * 10000)}`,
    amount: 50000,
    customer: {
      email: "hokaigome@gmail.com" // Menggunakan email Anda yang sudah terdaftar
    }
  }
};

const rawBody = JSON.stringify(payload);

// Generate Signature persis seperti cara Mayar melakukannya
const signature = crypto
  .createHmac('sha256', SECRET)
  .update(rawBody)
  .digest('hex');

console.log("Menembakkan simulasi Webhook ke Localhost...");
console.log(`Payload ID: ${payload.data.id}`);

fetch('http://localhost:3000/api/webhook/mayar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-mayar-signature': signature
  },
  body: rawBody
})
.then(res => res.json().then(data => ({ status: res.status, body: data })))
.then(result => {
  console.log("\nRespons Server Next.js:", result);
  if (result.status === 200) {
    console.log("✅ UJI PENETRASI SUKSES: Webhook menerima data asli dan memverifikasi signature.");
  } else {
    console.error("❌ GAGAL: Ada masalah pada validasi signature atau Firebase Admin.");
  }
})
.catch(err => {
    console.error("❌ Error Koneksi: Pastikan server 'npm run dev' berjalan di port 3000.");
});

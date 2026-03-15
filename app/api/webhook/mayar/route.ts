import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// 1. Inisialisasi Firebase Admin (The Master Key)
// PENTING: Di environment Vercel/Production, Anda harus memasukkan FIREBASE_PROJECT_ID, 
// FIREBASE_CLIENT_EMAIL, dan FIREBASE_PRIVATE_KEY dari Service Account Anda.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle format private key yang sering rusak karena escape characters (\n)
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export async function POST(request: Request) {
  try {
    // Ambil raw body sebagai string untuk verifikasi Signature
    const rawBody = await request.text();
    const headers = request.headers;
    
    // 2. Ekstraksi Signature dari Mayar
    // Sesuaikan header ini dengan dokumentasi resmi Mayar (biasanya 'x-mayar-signature' atau 'mayar-signature')
    const mayarSignature = headers.get('x-mayar-signature') || headers.get('mayar-signature'); 
    const secret = process.env.MAYAR_WEBHOOK_SECRET;

    if (!mayarSignature || !secret) {
      console.error("[WEBHOOK] Missing signature or secret");
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    // 3. Verifikasi Tanda Tangan Kriptografi (HMAC SHA256)
    // Ini memastikan payload 100% berasal dari server Mayar dan tidak dimodifikasi di jalan.
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== mayarSignature) {
      console.warn("[SECURITY] Webhook signature mismatch! Possible spoofing attack.");
      return NextResponse.json({ error: 'Invalid Signature' }, { status: 403 });
    }

    // 4. Parsing Payload yang sudah dijamin asli
    const payload = JSON.parse(rawBody);

    // Pastikan event ini adalah transaksi sukses
    if (payload.status === 'SUCCESS' || payload.status === 'SETTLED') {
      const { customer, id: transactionId, amount } = payload.data;
      const userEmail = customer.email;

      // 5. Resolusi Pengguna (Cari UID berdasarkan email)
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', userEmail).limit(1).get();

      if (snapshot.empty) {
        // [IDEMPOTENCY] Jika user belum terdaftar, simpan ke 'unclaimed_donations'
        // Nanti saat user mendaftar, Cloud Function onUserCreate akan menarik data ini (Fase 2)
        await db.collection('unclaimed_donations').doc(transactionId).set({
          email: userEmail,
          amount: amount,
          status: 'verified',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[WEBHOOK] Unclaimed donation saved for: ${userEmail}`);
      } else {
        // 6. Tulis langsung ke subkoleksi pengguna yang TERKUNCI
        // Karena kita menggunakan Admin SDK, operasi ini mengabaikan 'allow write: if false'
        const userDoc = snapshot.docs[0];
        await db.collection('users').doc(userDoc.id).collection('sadaqah').doc(transactionId).set({
          amount: amount,
          status: 'verified',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          source: 'mayar_webhook'
        });
        console.log(`[WEBHOOK] Sadaqah verified for user: ${userDoc.id}`);
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' }, { status: 200 });

  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// 1. Inisialisasi Admin SDK (Gunakan pola yang sama dengan Webhook Mayar)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export async function POST(request: Request) {
  try {
    // 2. Validasi Bearer Token (Sangat Krusial!)
    // Kita harus memastikan yang memanggil API ini benar-benar user yang sedang login di Firebase Auth klien.
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verifikasi Token ke Google Server
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // 3. Ekstrak data tambahan dari payload klien
    const { displayName, photoURL } = await request.json();

    // 4. Buat Dokumen Pengguna (Menggunakan Admin SDK, menembus allow create: if false)
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // THE CREATE LOGIC
      await userRef.set({
        email: email,
        displayName: displayName || 'Siswa Baru',
        photoURL: photoURL || '',
        role: 'student', // TERKUNCI: Paksa role default di server. Klien tidak bisa hack ini.
        totalXP: 0,
        streak: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Klaim Donasi yang Tertunda (Idempotency Resolver)
      // Jika user pernah transfer via Mayar sebelum mendaftar, pindahkan datanya sekarang!
      const unclaimedRef = db.collection('unclaimed_donations').where('email', '==', email);
      const unclaimedSnap = await unclaimedRef.get();

      if (!unclaimedSnap.empty) {
        const batch = db.batch();
        unclaimedSnap.docs.forEach(doc => {
          const targetRef = db.collection('users').doc(uid).collection('sadaqah').doc(doc.id);
          batch.set(targetRef, { ...doc.data(), claimedAt: admin.firestore.FieldValue.serverTimestamp() });
          batch.delete(doc.ref); // Hapus dari antrean
        });
        await batch.commit();
        console.log(`[AUTH SYNC] Berhasil mengklaim donasi untuk: ${email}`);
      }

      console.log(`[AUTH SYNC] Pengguna baru terdaftar: ${email}`);
      return NextResponse.json({ success: true, message: 'User created successfully', role: 'student' }, { status: 201 });
    }

    return NextResponse.json({ success: true, message: 'User already exists' }, { status: 200 });

  } catch (error) {
    console.error("[AUTH SYNC ERROR]", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

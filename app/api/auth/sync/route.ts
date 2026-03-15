import { NextResponse } from 'next/server';
import { ratelimit } from '@/lib/ratelimit';
import * as admin from 'firebase-admin';

// 1. Inisialisasi Admin SDK
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

// [HARDENING] Batas Kewajaran (Sanity Limits) untuk mencegah injeksi nilai raksasa
const MAX_ALLOWED_XP = 50000; // Batas XP maksimal yang masuk akal untuk durasi program
const MAX_STREAK = 30;       // Maksimal hari di bulan Ramadhan

export async function POST(request: Request) {
  try {
    // 1. [IP HARDENING] Deteksi IP asli dari header proxy Vercel/Cloudflare
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(',')[0].trim() : "127.0.0.1";
    
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // 2. Validasi Bearer Token (Firebase ID Token)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verifikasi Token ke Server Google (Server-side Auth)
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // 3. Ekstrak data dari payload klien
    const { displayName, photoURL, totalXP, streak } = await request.json();

    // 4. [XP HARDENING] Sanity Check / Anti-Postman Guard
    // Kita tidak percaya angka XP bulat-bulat dari client. Kita berikan batas atas (CAP).
    const sanitizedXP = Math.min(Number(totalXP) || 0, MAX_ALLOWED_XP);
    const sanitizedStreak = Math.min(Number(streak) || 0, MAX_STREAK);

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // ═══════════════════════════════════════════════════════
      // AUTO-ADMIN BOOTSTRAP (Phase 19)
      // ═══════════════════════════════════════════════════════
      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
      const isSuperAdmin = email ? superAdminEmails.includes(email.toLowerCase()) : false;
      const assignedRole = isSuperAdmin ? 'admin' : 'student';

      if (isSuperAdmin) {
        await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
      }

      // 5. Buat Dokumen Pengguna Baru
      await userRef.set({
        uid: uid,
        email: email,
        displayName: displayName || 'New User',
        photoURL: photoURL || '',
        role: assignedRole,
        totalXP: 0, // User baru selalu mulai dari 0
        streak: 0,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      // 6. Klaim Donasi yang Tertunda (Idempotency Resolver)
      if (email) {
        const unclaimedRef = db.collection('unclaimed_donations').where('email', '==', email);
        const unclaimedSnap = await unclaimedRef.get();

        if (!unclaimedSnap.empty) {
          const batch = db.batch();
          unclaimedSnap.docs.forEach(doc => {
            const targetRef = db.collection('users').doc(uid).collection('sadaqah').doc(doc.id);
            batch.set(targetRef, { ...doc.data(), claimedAt: admin.firestore.FieldValue.serverTimestamp() });
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`[AUTH SYNC] Claimed pending donations for: ${email}`);
        }
      }

      return NextResponse.json({ success: true, message: 'User created successfully', role: assignedRole }, { status: 201 });
    }

    // ═══════════════════════════════════════════════════════
    // [HARDENING] SYNC LOGIC UNTUK USER LAMA
    // ═══════════════════════════════════════════════════════
    // Update profil setiap kali login untuk sinkronisasi metadata terbaru dari Google
    // Serta update XP dan Streak dengan proteksi Sanitize yang kita buat di langkah 4.
    await userRef.update({
      displayName: displayName || userSnap.data()?.displayName,
      photoURL: photoURL || userSnap.data()?.photoURL,
      lastLogin: new Date().toISOString(),
      // Gunakan Math.max untuk memastikan progres tidak mundur, tapi tetap di bawah CAP
      totalXP: Math.max(userSnap.data()?.totalXP || 0, sanitizedXP),
      streak: Math.max(userSnap.data()?.streak || 0, sanitizedStreak)
    });

    const existingRole = userSnap.data()?.role || 'student';
    return NextResponse.json({ success: true, message: 'Profile synced', role: existingRole }, { status: 200 });

  } catch (error) {
    console.error("[AUTH SYNC ERROR]", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

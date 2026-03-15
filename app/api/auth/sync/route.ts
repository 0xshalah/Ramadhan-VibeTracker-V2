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
    // 2. Validasi Bearer Token
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
      // ═══════════════════════════════════════════════════════
      // THE WHITELIST CHECK (Anti-Catch-22 / RBAC Deadlock Breaker)
      // ═══════════════════════════════════════════════════════
      // Before blindly stamping everyone as 'student', check if the
      // Admin has pre-registered this email in the `whitelisted_staff`
      // collection via Firebase Console. If found, assign their role.
      let assignedRole = 'student'; // Default aman untuk publik

      if (email) {
        const staffRef = db.collection('whitelisted_staff').doc(email);
        const staffSnap = await staffRef.get();

        if (staffSnap.exists) {
          assignedRole = staffSnap.data()?.role || 'teacher';
          console.log(`[AUTH SYNC] Staff Whitelist Matched! Assigning role: ${assignedRole} for ${email}`);
        }
      }

      // 5. Buat Dokumen Pengguna dengan Role yang Dinamis
      await userRef.set({
        uid: uid, // CRITICAL: Zod UserProfileSchema requires this field!
        email: email,
        displayName: displayName || 'New User',
        photoURL: photoURL || '',
        role: assignedRole, // Dynamically locked based on Whitelist!
        totalXP: 0,
        streak: 0,
        createdAt: new Date().toISOString(), // Use ISO string, not Firestore Timestamp (Zod expects string)
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

      console.log(`[AUTH SYNC] New user registered as '${assignedRole}': ${email}`);
      return NextResponse.json({ success: true, message: 'User created successfully', role: assignedRole }, { status: 201 });
    }

    // Existing user — return their current role
    const existingRole = userSnap.data()?.role || 'student';
    return NextResponse.json({ success: true, message: 'User already exists', role: existingRole }, { status: 200 });

  } catch (error) {
    console.error("[AUTH SYNC ERROR]", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

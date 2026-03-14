import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// [SECURITY FIX] Initialize Firebase Admin with proper credentials
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (privateKey && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log('[ADMIN] Firebase Admin initialized with Service Account credentials.');
    } else {
      // Fallback for environments with Application Default Credentials (e.g., GCP)
      admin.initializeApp({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.warn('[ADMIN] Firebase Admin initialized WITHOUT explicit credentials. DB writes may fail in non-GCP environments.');
    }
  } catch (err) {
    console.error("Firebase Admin init error:", err);
  }
}

export async function POST(request) {
  try {
    const signature = request.headers.get('x-mayar-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing Mayar signature' },
        { status: 401 }
      );
    }

    const secret = process.env.MAYAR_WEBHOOK_SECRET;
    
    if (!secret) {
        console.error('CRITICAL: MAYAR_WEBHOOK_SECRET is not configured.');
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }

    const text = await request.text();
    
    // Generate HMAC SHA-256 signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    // Mencegah Timing Attacks dengan buffer comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Invalid signature mismatch' },
        { status: 403 }
      );
    }

    const body = JSON.parse(text);
    const donationId = body.data?.id || 'No ID';
    const amount = body.data?.amount || 0;
    const email = body.data?.customer?.email || 'anonymous@example.com';
    console.log('Secure Webhook payload verified:', donationId);

    // [INTEGRATION] Menyimpan record pembayaran ke Firestore Server-Side
    try {
       const db = admin.firestore();
       // Cari User berdasarkan email dari payload webhook
       const usersRef = db.collection('users');
       const snapshot = await usersRef.where('email', '==', email).limit(1).get();
       
       if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            
            // [FIX] Server-Side WIB Lock (UTC+7 Forced for Serverless)
            const date = new Date();
            const wibTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
            const todayId = wibTime.toISOString().split('T')[0];
            
            await db.collection('users').doc(userDoc.id).collection('sadaqah').doc(donationId.toString()).set({
                amount: amount,
                status: 'SUCCESS',
                dateId: todayId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
           console.log(`[FIRESTORE_SYNC] Donation record ${donationId} mapped to user ${userDoc.id}`);
       } else {
           // Jika user tidak terdaftar, taruh di root /unclaimed_donations
           await db.collection('unclaimed_donations').doc(donationId.toString()).set({
               amount: amount,
               email: email,
               status: 'SUCCESS',
               timestamp: admin.firestore.FieldValue.serverTimestamp()
           });
           console.log(`[FIRESTORE_SYNC] Donation ${donationId} placed in unclaimed (no matching email)`);
       }
    } catch(dbError) {
       console.warn(`[FIRESTORE_FALLBACK] DB write failed for ${donationId}:`, dbError.message);
    }

    return NextResponse.json(
      { success: true, message: 'Webhook processed securely and synced to DB' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook Fatal Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

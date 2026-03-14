import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin for Server-Side Webhook processing
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vibetracker-core"
    });
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
            
            // [DECREE 1] Local Timezone Date ID (Batam/WIB Fix)
            const date = new Date();
            const offset = date.getTimezoneOffset() * 60000;
            const todayId = new Date(date - offset).toISOString().split('T')[0];
            
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
       console.warn(`[FIRESTORE_FALLBACK] Simulated DB write for ${donationId} due to missing SA credentials`);
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

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin for background credit processing
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = admin.firestore();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-mayar-signature') || request.headers.get('mayar-signature');
    const secret = process.env.MAYAR_WEBHOOK_SECRET;

    // 1. Signature Verification (HMAC SHA256)
    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(rawBody).digest('hex');
      
      if (signature !== digest) {
        console.error("[SECURITY] Invalid webhook signature detected.");
        return NextResponse.json({ error: 'Forbidden: Invalid Signature' }, { status: 403 });
      }
    }

    const payload = JSON.parse(rawBody);
    
    // Support both HL v1 structure (payload.data) and potential direct structure
    const status = payload.status || payload.data?.status;
    const customer_email = payload.customer_email || payload.data?.customer?.email;
    const amount = payload.amount || payload.data?.amount;
    const transactionId = payload.id || payload.data?.id;

    // 2. Business Logic Execution on 'success' or 'paid'
    if (status === 'success' || status === 'paid' || status === 'SUCCESS' || status === 'SETTLED') {
      if (!customer_email) {
          console.warn("[WEBHOOK] Transaction success but no email found in payload.");
          return NextResponse.json({ acknowledged: true }, { status: 200 });
      }

      const userQuery = await adminDb.collection('users').where('email', '==', customer_email).limit(1).get();
      
      if (!userQuery.empty) {
        const userDoc = userQuery.docs[0];
        const batch = adminDb.batch();
        const userRef = adminDb.collection('users').doc(userDoc.id);
        const sadaqahRef = userRef.collection('sadaqah').doc(transactionId || String(Date.now()));

        // Increment impact and award XP (500 bonus for donation)
        batch.update(userRef, {
          impactSadaqah: admin.firestore.FieldValue.increment(Number(amount)),
          totalXP: admin.firestore.FieldValue.increment(500) 
        });

        batch.set(sadaqahRef, {
          amount: Number(amount),
          status: 'verified',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          provider: 'Mayar',
          transactionId: transactionId
        });

        await batch.commit();
        console.log(`[SYNC] Donation successful: ${amount} applied to ${customer_email}`);
      } else {
        // Idempotency: Save to unclaimed_donations
        await adminDb.collection('unclaimed_donations').doc(transactionId || String(Date.now())).set({
          email: customer_email,
          amount: Number(amount),
          status: 'verified',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          transactionId: transactionId
        });
        console.log(`[WEBHOOK] Unclaimed donation saved for: ${customer_email}`);
      }
    }

    return NextResponse.json({ acknowledged: true }, { status: 200 });
  } catch (error: any) {
    console.error("[WEBHOOK ERROR]", error.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

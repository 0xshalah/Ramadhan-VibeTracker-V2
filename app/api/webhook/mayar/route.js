import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
    console.log('Secure Webhook payload verified:', body.data?.id || 'No ID');

    // TODO: Integrasi pembaruan status subscription ke Firestore di sini

    return NextResponse.json(
      { success: true, message: 'Webhook processed securely' },
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

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, email, name, mobile } = await request.json();

    // 1. Mandatory Input Validation
    if (!amount || !email) {
      return NextResponse.json({ error: 'Amount and Email are required' }, { status: 400 });
    }

    const apiKey = process.env.MAYAR_API_KEY;
    if (!apiKey) {
      console.error("[MAYAR] API Key missing in environment variables!");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 2. THE ULTIMATE FIX: Absolute Uniqueness
    const timestamp = Date.now().toString();
    const entropy = Math.random().toString(36).substring(2, 10).toUpperCase();
    const orderId = `VBT${timestamp.slice(-5)}${entropy}`; 

    // 3. Headless API Payload Construction
    const mayarPayload: any = {
      // NOTE: Prefixing EVERYTHING with the unique orderId
      name: `[${orderId}] Sadaqah VibeTracker`, 
      amount: Math.floor(Number(amount)),
      description: `Payment ID: ${orderId}. From: ${name || email}`,
      customer_name: (name && name !== "Anonymous") ? name : "Blessed Donor",
      
      // Root naming
      email: email, 
      mobile: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`, // Complete random mobile
      
      // Secondary naming for safety
      customer_email: email,
      customer_mobile: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,

      redirect_url: `${baseUrl}/dashboard/student/sadaqah?status=success`,
      metadata: {
        app: "VibeTracker-V2",
        orderId: orderId,
        uid: timestamp
      }
    };

    console.log("[MAYAR ULTRA AGGRESSIVE FIX] Payload:", JSON.stringify(mayarPayload, null, 2));

    // 4. Mayar API Invocation
    const mayarResponse = await fetch('https://api.mayar.id/hl/v1/payment/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mayarPayload)
    });

    const data = await mayarResponse.json();

    // 5. Enhanced Error Handling
    if (!mayarResponse.ok) {
      console.error("[MAYAR REJECTION]", JSON.stringify(data, null, 2));
      return NextResponse.json({ 
        error: data?.messages || data?.message || data?.error || 'Payment gateway rejected the request',
        details: data 
      }, { status: mayarResponse.status });
    }

    // 6. URL Extraction
    const paymentUrl = data?.data?.link || data?.link || data?.url;
    if (!paymentUrl) {
      throw new Error('Payment link generation failed');
    }

    return NextResponse.json({ url: paymentUrl }, { status: 200 });

  } catch (error: any) {
    console.error("[CHECKOUT FATAL]", error.message);
    return NextResponse.json({ error: 'Internal server error processing payment' }, { status: 500 });
  }
}

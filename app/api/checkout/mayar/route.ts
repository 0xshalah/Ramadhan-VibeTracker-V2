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

    // 2. Generate a Unique Identifier to prevent 409 Conflict
    // We add a short unique ID (timestamp + random) to ensure Mayar sees this as a new request
    const uniqueSuffix = Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase();

    // 3. Headless API Payload Construction
    const mayarPayload = {
      // FIX: Added unique suffix to the name to avoid "already exist" error
      name: `Ramadan Charity - Rp ${Number(amount).toLocaleString('en-US')} (${uniqueSuffix})`, 
      amount: Math.floor(Number(amount)),
      description: `Sadaqah contribution from ${name || email} - Order ID: ${uniqueSuffix}`,
      customer_name: (name && name !== "Anonymous") ? name : "Blessed Donor",
      email: email, 
      mobile: mobile || "081234567890", 
      redirect_url: `${baseUrl}/dashboard/student/sadaqah?status=success`,
      metadata: {
        app: "VibeTracker-V2",
        type: "Sadaqah",
        orderId: uniqueSuffix, // Trackable ID
        platform: "Web-Enterprise"
      }
    };

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
        error: data?.messages || data?.error || 'Payment gateway rejected the request',
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

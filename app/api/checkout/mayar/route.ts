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

    // 2. THE MINIMALIST FIX: Maximum Uniqueness, Minimal Fields
    const hexId = Math.random().toString(16).substring(2, 14).toUpperCase();
    const trulyRandomMobile = `08${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    // 3. Headless API Payload Construction
    // We remove redundant fields and extra prefixes that might trigger slug collisions
    const mayarPayload: any = {
      name: `TX${hexId}`, 
      amount: Math.floor(Number(amount)),
      description: `Donation ${hexId}`,
      customer_name: name || "Blessed Donor",
      email: email, 
      mobile: trulyRandomMobile, 
      redirect_url: `${baseUrl}/dashboard/student/sadaqah?status=success&trx=${hexId}`,
      metadata: {
        hexId: hexId,
        source: "VBT-V2"
      }
    };

    console.log("[MAYAR MINIMALIST FIX] Payload:", JSON.stringify(mayarPayload, null, 2));

    // 4. Mayar API Invocation with NO-CACHE
    const mayarResponse = await fetch('https://api.mayar.id/hl/v1/payment/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mayarPayload),
      // Fix: Only use cache: 'no-store' to avoid Next.js warnings
      cache: 'no-store'
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

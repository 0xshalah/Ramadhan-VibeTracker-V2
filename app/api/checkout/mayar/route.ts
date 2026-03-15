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

    // 2. THE ATOMIC FIX: Pure Randomness + Cache Bypass
    const atomicId = Math.random().toString(36).substring(2, 15).toUpperCase() + Date.now().toString().slice(-4);
    
    // 3. Headless API Payload Construction
    const mayarPayload: any = {
      // name is often used as a unique slug. We use a pure random ID here.
      name: `SADAQAH-${atomicId}`, 
      amount: Math.floor(Number(amount)),
      description: `Ramadan Donation Ref: ${atomicId}`,
      customer_name: (name && name !== "Anonymous") ? name : "Blessed Donor",
      
      // Required fields at root
      email: email, 
      mobile: "081234567890", // Static valid mobile to avoid formatting rejection
      
      // Secondary fields for backup
      customer_email: email,
      customer_mobile: "081234567890",

      redirect_url: `${baseUrl}/dashboard/student/sadaqah?status=success&oid=${atomicId}`,
      metadata: {
        atomicId: atomicId,
        v: "4.0"
      }
    };

    console.log("[MAYAR ATOMIC FIX] Payload:", JSON.stringify(mayarPayload, null, 2));

    // 4. Mayar API Invocation with NO-CACHE headers
    const mayarResponse = await fetch('https://api.mayar.id/hl/v1/payment/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mayarPayload),
      // CRITICAL: Force Next.js to NOT cache this specific API call
      cache: 'no-store',
      // @ts-ignore
      next: { revalidate: 0 }
    } as any);

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

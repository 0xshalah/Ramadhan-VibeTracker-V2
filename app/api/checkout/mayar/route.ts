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

    // 2. Headless API Payload Construction
    // FIX: Aligned field names with Mayar's validation requirements ('email' and 'mobile')
    const mayarPayload = {
      name: `Ramadan Charity - Rp ${Number(amount).toLocaleString('en-US')}`, // Product Name
      amount: Math.floor(Number(amount)),
      description: `Sadaqah contribution from ${name || email}`,
      customer_name: (name && name !== "Anonymous") ? name : "Blessed Donor",
      email: email, // FIX: Changed from customer_email to email
      mobile: mobile || "081234567890", // FIX: Changed from customer_mobile to mobile
      redirect_url: `${baseUrl}/dashboard/student/sadaqah?status=success`,
      metadata: {
        app: "VibeTracker-V2",
        type: "Sadaqah",
        platform: "Web-Enterprise"
      }
    };

    // 3. Mayar API Invocation
    const mayarResponse = await fetch('https://api.mayar.id/hl/v1/payment/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mayarPayload)
    });

    const data = await mayarResponse.json();

    // 4. Enhanced Error Handling
    if (!mayarResponse.ok) {
      console.error("[MAYAR REJECTION]", JSON.stringify(data, null, 2));
      return NextResponse.json({ 
        error: data?.message || 'Payment gateway rejected the request',
        details: data 
      }, { status: mayarResponse.status });
    }

    // 5. URL Extraction
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

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, email, name } = await request.json();

    if (!amount || !email) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const apiKey = process.env.MAYAR_API_KEY;

    if (!apiKey) {
      console.warn("[CHECKOUT] MAYAR_API_KEY is not defined. Using mock redirect.");
      return NextResponse.json({ url: `https://mock.mayar.id/pay/${Date.now()}` }, { status: 200 });
    }

    // 1. Tentukan Base URL untuk Redirect Kembali ke VibeTracker
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 2. Eksekusi Request ke API Mayar
    const mayarResponse = await fetch('https://api.mayar.id/hl/v1/payment/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Sadaqah Ramadhan - Rp ${Number(amount).toLocaleString('id-ID')}`,
        amount: Number(amount),
        description: `Daily Charity for ${email}`,
        customerName: name || "Anonymous Student",
        email: email,
        mobile: "081111111111", // [MAYAR HOTFIX] Required by some Mayar accounts
        // Redirect user back to dashboard after payment
        redirect_url: `${baseUrl}/dashboard/student/sadaqah?status=success`,
        // Metadata for Mayar dashboard tracking
        metadata: {
          app: "VibeTracker-V2",
          category: "Ramadan-Sadaqah"
        }
      })
    });

    const data = await mayarResponse.json();

    if (!mayarResponse.ok) {
      console.error("[MAYAR_API_ERROR]", JSON.stringify(data, null, 2));
      const errorMessage = data?.message || 'Mayar API rejected the request';
      return NextResponse.json({ error: errorMessage, details: data }, { status: mayarResponse.status });
    }

    // 3. Flexible link extraction (different Mayar account structures)
    const paymentUrl = data?.data?.link || data?.link || data?.url;

    if (!paymentUrl) {
      console.error("[MAYAR_API_ERROR] No payment link found in successful response", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: 'Payment link missing in Mayar response' }, { status: 500 });
    }

    return NextResponse.json({ url: paymentUrl }, { status: 200 });

  } catch (error) {
    console.error("[CHECKOUT_INTERNAL_ERROR]", error);
    return NextResponse.json({ error: 'Failed to communicate with payment gateway' }, { status: 500 });
  }
}

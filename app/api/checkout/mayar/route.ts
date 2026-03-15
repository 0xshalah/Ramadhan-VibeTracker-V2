import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, email, name } = await request.json();

    if (!amount || !email) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const apiKey = process.env.MAYAR_API_KEY;

    if (!apiKey) {
      console.warn("[CHECKOUT] MAYAR_API_KEY is not defined. Using mock redirect for development.");
      // Fallback mock payment link if no API key is set for testing
      return NextResponse.json({ url: `https://mock.mayar.id/pay/${Date.now()}` }, { status: 200 });
    }

    // Memanggil API resim Mayar untuk membuat Single Payment Request
    const mayarResponse = await fetch('https://api.mayar.id/hl/v1/payment/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Sadaqah Ramadhan - ${amount}`,
        amount: Number(amount),
        description: "VibeTracker Daily Charity & Impact Subscription",
        customer_name: name || "Hamba Allah",
        customer_email: email,
      })
    });

    const data = await mayarResponse.json();

    if (!mayarResponse.ok) {
      console.error("[MAYAR_API_ERROR]", data);
      return NextResponse.json({ error: 'Failed to generate Mayar payment link', details: data }, { status: 500 });
    }

    // Biasanya Mayar mengembalikan link di data.data.link atau data.link
    const paymentUrl = data?.data?.link || data?.link;

    if (!paymentUrl) {
      console.error("[MAYAR_API_ERROR] No link found in response", data);
      return NextResponse.json({ error: 'Provide link not found in response' }, { status: 500 });
    }

    return NextResponse.json({ url: paymentUrl }, { status: 200 });

  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

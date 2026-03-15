import { NextResponse } from 'next/server';
import https from 'https';

// Helper to perform native HTTPS request (bypassing Next.js fetch cache/overrides)
function performMayarRequest(options: any, payload: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

export async function POST(request: Request) {
  try {
    const { amount, email, name, mobile } = await request.json();

    if (!amount || !email) {
      return NextResponse.json({ error: 'Amount and Email are required' }, { status: 400 });
    }

    const apiKey = process.env.MAYAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const randomId = Math.random().toString(36).substring(2, 12).toUpperCase();

    // Replicating the successful script payload EXACTLY
    const mayarPayload = JSON.stringify({
      name: `SADAQAH_${randomId}`,
      amount: Math.floor(Number(amount)),
      description: `Donation Ref: ${randomId}`,
      customer_name: name || "Blessed Donor",
      email: email,
      mobile: mobile || "081234567890",
      redirect_url: `${baseUrl}/dashboard/student/sadaqah?status=success&ref=${randomId}`
    });

    console.log("[MAYAR HTTPS BYPASS] Sending Payload:", mayarPayload);

    const options = {
      hostname: 'api.mayar.id',
      port: 443,
      path: '/hl/v1/payment/create',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'Content-Length': mayarPayload.length
      }
    };

    const response: any = await performMayarRequest(options, mayarPayload);

    if (response.status !== 200 && response.status !== 201) {
      console.error("[MAYAR BYPASS REJECTION]", response.status, JSON.stringify(response.data || response.raw, null, 2));
      return NextResponse.json({ 
        error: response.data?.messages || 'Mayar API error', 
        details: response.data 
      }, { status: response.status });
    }

    const paymentUrl = response.data?.data?.link || response.data?.link;
    if (!paymentUrl) {
      throw new Error('Payment link not found in response');
    }

    return NextResponse.json({ url: paymentUrl });

  } catch (error: any) {
    console.error("[CHECKOUT FATAL]", error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

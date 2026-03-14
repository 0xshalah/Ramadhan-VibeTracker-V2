import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const signature = request.headers.get('x-mayar-signature');
    
    // Skenario Mock: Cek keberadaan signature
    if (!signature) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing Mayar signature' },
        { status: 401 }
      );
    }

    // Jika signature ada (mock sukses)
    const text = await request.text();
    let body = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch(e) {}
    }

    console.log('Webhook payload received:', body);

    return NextResponse.json(
      { success: true, message: 'Webhook processed successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, email, name } = await request.json();

    // 1. Validasi Input dari Frontend
    if (!amount || !email) {
      return NextResponse.json({ error: 'Amount dan Email wajib diisi' }, { status: 400 });
    }

    const apiKey = process.env.MAYAR_API_KEY;
    if (!apiKey) {
      console.error("[MAYAR] API Key tidak ditemukan di environment variables!");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 2. Format Payload sesuai standar ketat Mayar
    const mayarPayload = {
      name: `Sadaqah Ramadhan - Rp ${amount.toLocaleString('id-ID')}`, // Nama Produk/Tagihan
      amount: Number(amount),
      description: `Daily Charity from ${name || email}`,
      customer_name: name || "Hamba Allah", // Mayar sering mewajibkan ini
      customer_email: email,
      redirect_url: `${baseUrl}/dashboard/student/sadaqah?status=success`, // Kembali ke dashboard
      metadata: {
        app: "VibeTracker-V2",
        type: "Sadaqah"
      }
    };

    // 3. Tembak API Mayar
    const mayarResponse = await fetch('https://api.mayar.id/hl/v1/payment/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`, // WAJIB ADA KATA 'Bearer '
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mayarPayload)
    });

    const data = await mayarResponse.json();

    // 4. Tangani Penolakan (Rejection) dari Mayar
    if (!mayarResponse.ok) {
      console.error("[MAYAR API REJECTED]", JSON.stringify(data, null, 2));
      const errorMessage = data?.message || data?.error || 'Mayar API menolak request ini';
      return NextResponse.json({ error: errorMessage, details: data }, { status: mayarResponse.status });
    }

    // 5. Ekstrak Link Pembayaran (Mayar bisa menaruh link di data.link atau data.data.link)
    const paymentUrl = data?.data?.link || data?.link || data?.url;

    if (!paymentUrl) {
      console.error("[MAYAR API ERROR] Link pembayaran tidak ditemukan di response:", data);
      return NextResponse.json({ error: 'Gagal mendapatkan link pembayaran dari Mayar' }, { status: 500 });
    }

    // 6. Kembalikan URL ke Frontend
    return NextResponse.json({ url: paymentUrl }, { status: 200 });

  } catch (error: any) {
    console.error("[CHECKOUT FATAL ERROR]", error.message);
    return NextResponse.json({ error: 'Gagal memproses pembayaran ke server' }, { status: 500 });
  }
}

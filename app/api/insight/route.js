import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// [ENTERPRISE] Inisialisasi Redis untuk Rate Limiting
// Jika env variables tidak tersedia, rate limiter akan di-bypass (graceful degradation)
let ratelimit = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Aturan ketat: Maksimal 3 request per 10 detik per identifier
  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(3, '10 s'),
    analytics: true,
  });
}

export async function POST(request) {
  try {
    // [LAYER 1] Validasi Otorisasi Dasar
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized Access Denied' }, { status: 401 });
    }

    // [LAYER 2] Rate Limiting (jika Redis tersedia)
    if (ratelimit) {
      const identifier = authHeader.split('Bearer ')[1]?.substring(0, 32) || 'anonymous';
      const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_insight_${identifier}`);

      if (!success) {
        console.warn(`[SECURITY] Rate limit exceeded for identifier: ${identifier.substring(0, 8)}...`);
        return NextResponse.json(
          { insight: "Sabar, spiritualitas butuh ketenangan. Tunggu sejenak sebelum meminta insight baru. 🧘" },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString()
            }
          }
        );
      }
    }

    // [LAYER 3] Proses Payload Klien
    const { progressData } = await request.json();
    const apiKey = process.env.ALIBABA_CLOUD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { insight: "Refleksi spiritual sedang tidak tersedia. Tetap semangat beribadah! 🌙" },
        { status: 200 }
      );
    }

    // [LAYER 4] Panggilan ke LLM Alibaba Cloud Qwen
    const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        input: {
          messages: [
            {
              role: "system",
              content: "Kamu adalah pendamping spiritual Ramadhan yang bijak dan hangat. Berikan insight pendek (maksimal 2 kalimat) berdasarkan data ibadah user. Gunakan bahasa Indonesia yang lembut dan memotivasi. Sertakan emoji yang relevan."
            },
            {
              role: "user",
              content: `Progres ibadah hari ini: Sholat ${progressData.sholatPct}% terpenuhi, Tilawah: ${progressData.tilawah} halaman dari target ${progressData.targetTilawah}, Streak: ${progressData.streak} hari berturut-turut, Sunnah terpenuhi: ${progressData.sunnahCount} dari 5.`
            }
          ]
        }
      })
    });

    if (!response.ok) {
      console.error('[AI_INSIGHT] API Error:', response.status);
      return NextResponse.json(
        { insight: "Setiap langkah kecil dalam ibadah adalah investasi abadi. Terus istiqomah! ✨" },
        { status: 200 }
      );
    }

    const aiData = await response.json();
    const insightText = aiData?.output?.text || aiData?.output?.choices?.[0]?.message?.content || "Tetap semangat menjalani Ramadhan dengan penuh keikhlasan. 🌙";

    return NextResponse.json({ insight: insightText });
  } catch (error) {
    console.error('[AI_INSIGHT] Fatal:', error);
    return NextResponse.json(
      { insight: "Setiap langkah kecil dalam ibadah adalah investasi abadi. Terus istiqomah! ✨" },
      { status: 200 }
    );
  }
}

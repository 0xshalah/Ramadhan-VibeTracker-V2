import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ratelimit } from '@/lib/ratelimit';

// 1. Zod Schema untuk memblokir payload sampah yang menguras token
const ProgressContextSchema = z.object({
  sholatPct: z.number().min(0).max(100),
  tilawah: z.number().nonnegative(),
  targetTilawah: z.number().min(1),
  streak: z.number().nonnegative(),
  sunnahCount: z.number().nonnegative().optional(), // Tambahan untuk mem-parsing dari req sebelumnya
});

export async function POST(request: Request) {
  try {
    // [LAYER 1] Validasi Otorisasi Dasar
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized Access Denied' }, { status: 401 });
    }

    // [LAYER 2] Rate Limiting
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

    const apiKey = process.env.ALIBABA_CLOUD_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { insight: "Refleksi spiritual sedang tidak tersedia. Tetap semangat beribadah! 🌙" },
        { status: 200 }
      );
    }

    const body = await request.json();
    // Klien wajib mengirim riwayat chat (messages) DAN data progres
    const { messages, progressData } = body; 

    // 2. Bersihkan Data Progres
    const safeData = ProgressContextSchema.parse(progressData);

    // 3. Dynamic System Prompt (Rahasia di balik layar)
    const systemPrompt = `You are a wise, empathetic Ramadan Spiritual Companion. 
    Respond in English. Be concise (max 2-3 sentences). 
    Silent context about the user today: 
    - Obligatory Prayers completed: ${safeData.sholatPct}%
    - Quran Recitation: ${safeData.tilawah} out of ${safeData.targetTilawah} pages.
    - Current Consistency Streak: ${safeData.streak} days.
    Do not explicitly list these stats unless relevant to the user's message. Comfort them if they are sad, motivate them if they are lazy, answer strictly to what they discuss. Remember you are an AI companion. Keep your response comforting and religiously motivating.`;

    // 4. Rakit Ingatan AI (Gabungkan System + Riwayat Obrolan User)
    const qwenPayload = [
      { role: "system", content: systemPrompt },
      ...(messages || [])
    ];

    const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        input: { messages: qwenPayload }
      })
    });

    if (!response.ok) {
      console.error('[AI_INSIGHT] API Error:', response.status);
      return NextResponse.json(
        { insight: "Every small step in worship is an eternal investment. Keep up the consistency! ✨" },
        { status: 200 }
      );
    }

    const aiData = await response.json();
    const insightText = aiData?.output?.text || aiData?.output?.choices?.[0]?.message?.content || "Keep up the good work for Ramadan. 🌙";
    
    return NextResponse.json({ insight: insightText });

  } catch (error) {
    console.error('[AI_ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { progressData } = await request.json();
    
    const apiKey = process.env.ALIBABA_CLOUD_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { insight: "Refleksi spiritual sedang tidak tersedia. Tetap semangat beribadah! 🌙" },
        { status: 200 }
      );
    }

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

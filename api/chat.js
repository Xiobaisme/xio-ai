// pages/api/chat.js
// Backend: menerima pesan dari UI, kirim ke OpenRouter, kembalikan respons AI

export default async function handler(req, res) {
  // Hanya terima method POST
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  // Cek API key tersedia
  const API_KEY = process.env.OPENROUTER_API_KEY;
  if (!API_KEY) {
    return res
      .status(500)
      .json({ reply: "⚠️ OPENROUTER_API_KEY belum diset di environment variables" });
  }

  const { message, history = [] } = req.body;

  // Validasi input
  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ reply: "⚠️ Pesan tidak boleh kosong" });
  }

  // Bangun array messages untuk API (sistem + riwayat + pesan baru)
  const messages = [
    {
      role: "system",
      content:
        "Kamu adalah NEXUS-AI, asisten kecerdasan buatan canggih yang berjalan di dalam antarmuka terminal hacker. " +
        "Jawab dengan tepat, informatif, dan efisien. " +
        "Gunakan bahasa Indonesia kecuali user menulis dalam bahasa lain. " +
        "Untuk kode, gunakan format markdown code block. " +
        "Jangan terlalu panjang — utamakan kejelasan dan ketepatan.",
    },
    ...history,
    { role: "user", content: message.trim() },
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        // Header wajib OpenRouter
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "NEXUS-AI Terminal",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free", // Model Qwen free tier
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    // Tangani error HTTP dari OpenRouter
    if (!response.ok) {
      const errBody = await response.text();
      console.error(`OpenRouter HTTP ${response.status}:`, errBody);
      return res.status(502).json({
        reply: `⚠️ OpenRouter error ${response.status}: ${errBody.slice(0, 300)}`,
      });
    }

    const data = await response.json();

    // Ekstrak respons AI
    const aiReply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ AI tidak memberikan respons. Coba lagi.";

    return res.status(200).json({ reply: aiReply });
  } catch (error) {
    // Error jaringan atau lainnya
    console.error("Chat API error:", error);
    return res.status(500).json({
      reply: `⚠️ Koneksi gagal: ${error.message}`,
    });
  }
}

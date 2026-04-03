export default async function handler(req, res) {
  const API_KEY = process.env.OPENROUTER_API_KEY;

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { message } = req.body;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3.6",
        messages: [
          { role: "user", content: `Kamu adalah AI coding assistant. Bisa jawab teks dan jika perlu kirim link gambar PNG/JPG dengan format: !img <URL>\n\nUser: ${message}` }
        ],
        max_tokens: 500
      })
    });

    const data = await response.json();
    const aiReply = data?.choices?.[0]?.message?.content ?? "⚠️ AI tidak merespon";

    res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "⚠️ Error: OpenRouter API tidak bisa diakses" });
  }
}

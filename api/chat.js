export default async function handler(req, res) {
  const API_KEY = process.env.CLAUDE_API_KEY;

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { message } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-instant-1", // model alternatif
        prompt: `Kamu adalah AI coding assistant. Jawab singkat dan jelas.\n\nUser: ${message}\nAI:`,
        max_tokens_to_sample: 300
      })
    });

    const data = await response.json();

    const aiReply = data.completion ?? "⚠️ Claude tidak merespon";

    res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "⚠️ Error: Claude API tidak bisa diakses" });
  }
}

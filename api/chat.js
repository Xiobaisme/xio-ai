export default async function handler(req, res) {
  const API_KEY = process.env.CLAUDE_API_KEY;

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const { message } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-latest",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Kamu adalah AI coding assistant.
Jawab singkat, jelas, langsung ke code.

User: ${message}`
          }
        ]
      })
    });

    const data = await response.json();

    // Claude API terbaru biasanya ada di data.completion.content
    const aiReply = data.completion?.content ?? "⚠️ Claude tidak merespon";

    res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "⚠️ Error: Claude API tidak bisa diakses" });
  }
}

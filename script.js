const chat = document.getElementById("chat");

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = "msg " + sender;
  div.innerText = (sender === "user" ? "➤ " : "AI: ") + text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function send() {
  const input = document.getElementById("input");
  const text = input.value;
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  addMessage("...", "ai"); // placeholder sementara

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    chat.lastChild.remove(); // hapus "..."
    addMessage(data.reply, "ai");

  } catch (e) {
    chat.lastChild.remove();
    addMessage("⚠️ Error: Tidak bisa connect ke backend", "ai");
  }
}

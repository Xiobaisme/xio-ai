const chat = document.getElementById("chat");

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = "msg " + sender;

  // Check if text contains !img <URL>
  const imgMatch = text.match(/!img (https?:\/\/\S+\.(png|jpg|jpeg|gif))/i);
  if (imgMatch) {
    div.innerText = sender === "user" ? "➤ " : "AI: ";
    const img = document.createElement("img");
    img.src = imgMatch[1];
    img.style.maxWidth = "100%";
    img.style.marginTop = "5px";
    div.appendChild(img);
  } else {
    // typing animation effect
    if(sender === "ai") {
      div.innerText = "AI: ";
      chat.appendChild(div);
      typeText(div, text.replace(/!img \S+/i, ""));
      return;
    }
    div.innerText = (sender === "user" ? "➤ " : "AI: ") + text;
  }

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// Typing effect
function typeText(element, text) {
  let i = 0;
  const interval = setInterval(() => {
    element.innerText += text.charAt(i);
    i++;
    chat.scrollTop = chat.scrollHeight;
    if (i >= text.length) clearInterval(interval);
  }, 20); // delay 20ms per char
}

async function send() {
  const input = document.getElementById("input");
  const text = input.value;
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  addMessage("...", "ai");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    chat.lastChild.remove();
    addMessage(data.reply, "ai");

  } catch (e) {
    chat.lastChild.remove();
    addMessage("⚠️ Error: Tidak bisa connect ke backend", "ai");
  }
}

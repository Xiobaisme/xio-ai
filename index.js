// pages/index.js
// UI Terminal Hacker — NEXUS-AI

import { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";
import styles from "../styles/Terminal.module.css";

/* ─── Konstanta ──────────────────────────────────────────── */

const MODEL_NAME = "qwen/qwen3-235b-a22b:free";

const BOOT_SEQUENCE = [
  { text: "NEXUS-AI TERMINAL v3.7.1", delay: 0 },
  { text: "Copyright (c) 2025 NEXUS Systems", delay: 180 },
  { text: "", delay: 280 },
  { text: "Initializing kernel modules.............. [OK]", delay: 420 },
  { text: "Loading cryptographic stack.............. [OK]", delay: 580 },
  { text: "Connecting to inference cluster.......... [OK]", delay: 740 },
  { text: `Model loaded: ${MODEL_NAME}`, delay: 900 },
  { text: "Encryption handshake complete............ [OK]", delay: 1060 },
  { text: "", delay: 1160 },
  { text: "──────────────────────────────────────────────────────", delay: 1220 },
  { text: "Sistem siap. Ketik pesan dan tekan ENTER.", delay: 1380 },
  { text: "──────────────────────────────────────────────────────", delay: 1440 },
  { text: "", delay: 1500 },
];

const SUGGESTIONS = [
  "Siapa kamu?",
  "Jelaskan konsep machine learning",
  "Tulis script Python hello world",
  "Apa itu quantum computing?",
  "Bantu saya debug kode",
];

/* ─── Helper: format waktu ───────────────────────────────── */
function timestamp() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/* ─── Komponen: baris teks ───────────────────────────────── */
function Line({ msg }) {
  if (msg.type === "boot") {
    return (
      <div className={styles.lineBoot}>
        <span>{msg.text}</span>
      </div>
    );
  }

  if (msg.type === "divider") {
    return <div className={styles.lineDivider} />;
  }

  if (msg.type === "user") {
    return (
      <div className={styles.lineUser}>
        <span className={styles.lineTs}>{msg.ts}</span>
        <span className={styles.linePrompt}>▶</span>
        <span className={styles.lineUserText}>{msg.text}</span>
      </div>
    );
  }

  if (msg.type === "ai") {
    return (
      <div className={styles.lineAi}>
        <span className={styles.lineTs}>{msg.ts}</span>
        <span className={styles.lineAiLabel}>AI</span>
        <span className={styles.lineAiText}>
          <RenderText text={msg.text} />
        </span>
      </div>
    );
  }

  if (msg.type === "thinking") {
    return (
      <div className={styles.lineThinking}>
        <span className={styles.lineTs}>{msg.ts}</span>
        <span className={styles.lineAiLabel}>AI</span>
        <span className={styles.thinkingDots}>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>
    );
  }

  if (msg.type === "error") {
    return (
      <div className={styles.lineError}>
        <span className={styles.lineTs}>{msg.ts}</span>
        <span className={styles.lineErrLabel}>ERR</span>
        <span>{msg.text}</span>
      </div>
    );
  }

  if (msg.type === "system") {
    return (
      <div className={styles.lineSystem}>
        <span className={styles.lineTs}>{msg.ts}</span>
        <span className={styles.lineSysLabel}>SYS</span>
        <span>{msg.text}</span>
      </div>
    );
  }

  return null;
}

/* ─── Render teks dengan code block ─────────────────────── */
function RenderText({ text }) {
  // Split berdasarkan code block ```...```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3);
          const newlineIdx = inner.indexOf("\n");
          const lang = newlineIdx !== -1 ? inner.slice(0, newlineIdx).trim() : "";
          const code = newlineIdx !== -1 ? inner.slice(newlineIdx + 1) : inner;
          return (
            <span key={i} className={styles.codeBlock}>
              {lang && <span className={styles.codeLang}>{lang}</span>}
              <code>{code}</code>
            </span>
          );
        }
        // Render inline `code`
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={i}>
            {inlineParts.map((ip, j) => {
              if (ip.startsWith("`") && ip.endsWith("`")) {
                return (
                  <code key={j} className={styles.inlineCode}>
                    {ip.slice(1, -1)}
                  </code>
                );
              }
              return <span key={j}>{ip}</span>;
            })}
          </span>
        );
      })}
    </>
  );
}

/* ─── Komponen: header ───────────────────────────────────── */
function Header({ msgCount, onClear }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(timestamp());
    const id = setInterval(() => setTime(timestamp()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <button className={`${styles.dot} ${styles.dotRed}`} onClick={onClear} title="Clear terminal" />
        <button className={`${styles.dot} ${styles.dotYellow}`} title="Minimize" />
        <button className={`${styles.dot} ${styles.dotGreen}`} title="Maximize" />
        <span className={styles.headerSep} />
        <span className={styles.headerTag}>nexus-ai</span>
      </div>

      <div className={styles.headerCenter}>
        <span className={styles.headerTitle}>NEXUS-AI // TERMINAL</span>
      </div>

      <div className={styles.headerRight}>
        <span className={styles.statusPulse} />
        <span className={styles.statusText}>ONLINE</span>
        <span className={styles.headerSep} />
        <span className={styles.clock}>{time}</span>
        <span className={styles.headerSep} />
        <span className={styles.msgCount}>MSG:{msgCount}</span>
      </div>
    </div>
  );
}

/* ─── Komponen: input bar ────────────────────────────────── */
function InputBar({ onSend, disabled, booted }) {
  const [value, setValue] = useState("");
  const [showSug, setShowSug] = useState(false);
  const ref = useRef(null);

  // Resize textarea otomatis
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") setShowSug(false);
  }

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    setShowSug(false);
  }

  function useSuggestion(s) {
    setValue(s);
    setShowSug(false);
    ref.current?.focus();
  }

  return (
    <div className={styles.inputWrapper}>
      {showSug && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className={styles.sugBtn} onClick={() => useSuggestion(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className={styles.inputRow}>
        <span className={styles.inputPrompt}>▶</span>
        <textarea
          ref={ref}
          className={styles.inputField}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => !value && setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          placeholder={booted ? "Ketik pesan... (Enter = kirim, Shift+Enter = baris baru)" : "Memuat..."}
          disabled={!booted || disabled}
          rows={1}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className={`${styles.sendBtn} ${disabled ? styles.sendBtnLoading : ""}`}
          onClick={submit}
          disabled={!booted || disabled || !value.trim()}
          title="Kirim (Enter)"
        >
          {disabled ? <SpinIcon /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.spinner}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Komponen: footer ───────────────────────────────────── */
function Footer({ tokenEst }) {
  return (
    <div className={styles.footer}>
      <span>MODEL: qwen3-235b-a22b:free</span>
      <span>via OpenRouter</span>
      <span>~{tokenEst} token konteks</span>
      <span>Shift+Enter = baris baru</span>
    </div>
  );
}

/* ─── Halaman utama ──────────────────────────────────────── */
export default function TerminalPage() {
  const [messages, setMessages] = useState([]);
  const [booted, setBooted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiHistory, setApiHistory] = useState([]); // riwayat untuk API context
  const [userMsgCount, setUserMsgCount] = useState(0);
  const bottomRef = useRef(null);

  // Estimasi token (rough: 1 token ≈ 4 karakter)
  const tokenEst = Math.round(
    apiHistory.reduce((acc, m) => acc + m.content.length, 0) / 4
  );

  // Boot sequence saat pertama load
  useEffect(() => {
    BOOT_SEQUENCE.forEach(({ text, delay }) => {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { type: "boot", text, id: `boot-${delay}` },
        ]);
      }, delay);
    });
    setTimeout(() => setBooted(true), BOOT_SEQUENCE[BOOT_SEQUENCE.length - 1].delay + 100);
  }, []);

  // Auto scroll ke bawah
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Kirim pesan
  const handleSend = useCallback(
    async (text) => {
      if (loading) return;

      const ts = timestamp();
      const thinkingId = `thinking-${Date.now()}`;

      // Tambah pesan user + thinking indicator
      setMessages((prev) => [
        ...prev,
        { type: "user", text, ts, id: `user-${Date.now()}` },
        { type: "thinking", ts, id: thinkingId },
      ]);
      setUserMsgCount((c) => c + 1);
      setLoading(true);

      const newHistory = [...apiHistory, { role: "user", content: text }];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history: apiHistory }),
        });

        const data = await res.json();
        const reply = data.reply ?? "⚠️ Tidak ada respons dari server.";
        const replyTs = timestamp();

        setMessages((prev) => [
          ...prev.filter((m) => m.id !== thinkingId),
          { type: "ai", text: reply, ts: replyTs, id: `ai-${Date.now()}` },
        ]);

        // Simpan ke history API (batasi 20 pesan terakhir agar tidak terlalu panjang)
        const updatedHistory = [
          ...newHistory,
          { role: "assistant", content: reply },
        ].slice(-20);
        setApiHistory(updatedHistory);
      } catch (err) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== thinkingId),
          {
            type: "error",
            text: `Gagal menghubungi server: ${err.message}`,
            ts: timestamp(),
            id: `err-${Date.now()}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, apiHistory]
  );

  // Clear terminal
  function handleClear() {
    setMessages([
      {
        type: "system",
        text: "Terminal dibersihkan. Sesi dan konteks tetap aktif.",
        ts: timestamp(),
        id: `sys-${Date.now()}`,
      },
    ]);
  }

  return (
    <>
      <Head>
        <title>NEXUS-AI Terminal</title>
        <meta name="description" content="AI terminal interface powered by Qwen via OpenRouter" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>▶</text></svg>" />
      </Head>

      {/* CRT scanline overlay */}
      <div className={styles.scanlines} aria-hidden="true" />

      {/* Ambient glow background */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      <div className={styles.shell}>
        <Header msgCount={userMsgCount} onClear={handleClear} />

        <main className={styles.output} role="log" aria-live="polite" aria-label="Terminal output">
          {messages.map((msg) => (
            <Line key={msg.id} msg={msg} />
          ))}
          {/* Blinking cursor saat idle */}
          {booted && !loading && (
            <span className={styles.idleCursor} aria-hidden="true">█</span>
          )}
          <div ref={bottomRef} />
        </main>

        <InputBar onSend={handleSend} disabled={loading} booted={booted} />
        <Footer tokenEst={tokenEst} />
      </div>
    </>
  );
}

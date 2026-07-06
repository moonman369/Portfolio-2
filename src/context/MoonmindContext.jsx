import { createContext, useContext, useState } from "react";

// Chat generation endpoint: hostname + Moonmind chat path.
const CHAT_ENDPOINT =
  import.meta.env.VITE_PORTFOLIO_API_HOSTNAME &&
  import.meta.env.VITE_PORTFOLIO_API_MOONMIND_CHAT_ENDPOINT
    ? `${import.meta.env.VITE_PORTFOLIO_API_HOSTNAME}${import.meta.env.VITE_PORTFOLIO_API_MOONMIND_CHAT_ENDPOINT}`
    : null;

export const MOONMIND_WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm Moonmind 🌙 — Ayan's AI portfolio assistant. Ask me anything about his skills, projects, or experience.",
};

const MoonmindContext = createContext();

export const MoonmindProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([MOONMIND_WELCOME]);
  const [loading, setLoading] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  const sendMessage = async (rawText) => {
    const text = (rawText ?? "").trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    if (!CHAT_ENDPOINT) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Moonmind isn't wired up yet. Set VITE_PORTFOLIO_API_HOSTNAME and VITE_PORTFOLIO_API_MOONMIND_CHAT_ENDPOINT in your .env to enable chat.",
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextMessages
            .filter((m) => m !== MOONMIND_WELCOME)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) throw new Error(`Moonmind API ${res.status}`);

      const contentType = res.headers.get("content-type") || "";
      let reply;
      if (contentType.includes("application/json")) {
        const data = await res.json();
        reply =
          data?.response ??
          data?.reply ??
          data?.message ??
          data?.answer ??
          data?.text ??
          (typeof data === "string" ? data : JSON.stringify(data));
      } else {
        reply = await res.text();
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply || "…" },
      ]);
    } catch (err) {
      console.error("Moonmind chat failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't reach the server right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MoonmindContext.Provider
      value={{ isOpen, open, close, toggle, messages, loading, sendMessage }}
    >
      {children}
    </MoonmindContext.Provider>
  );
};

export const useMoonmind = () => {
  const ctx = useContext(MoonmindContext);
  if (!ctx) {
    throw new Error("useMoonmind must be used within a MoonmindProvider");
  }
  return ctx;
};

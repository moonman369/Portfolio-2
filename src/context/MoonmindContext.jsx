import { createContext, useContext, useEffect, useState } from "react";

// Chat generation endpoint: hostname + Moonmind chat path.
const CHAT_ENDPOINT =
  import.meta.env.VITE_PORTFOLIO_API_HOSTNAME &&
  import.meta.env.VITE_PORTFOLIO_API_MOONMIND_CHAT_ENDPOINT
    ? `${import.meta.env.VITE_PORTFOLIO_API_HOSTNAME}${import.meta.env.VITE_PORTFOLIO_API_MOONMIND_CHAT_ENDPOINT}`
    : null;

const CHAT_PASSWORD = import.meta.env.VITE_PORTFOLIO_API_MOONMIND_CHAT_PASSWORD;

const STORAGE_KEY = "portfolio_chat_messages";
const SESSION_STORAGE_KEY = "portfolio_chat_session_id";

export const MOONMIND_WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm Moonmind 🌙 — Ayan's AI portfolio assistant. Ask me anything about his skills, projects, or experience.",
};

const generateSessionId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// Unescape literal "\n" / "\r\n" / "\t" the API may send in the summary.
const normalizeMarkdownText = (value = "") =>
  value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");

// Pull the reply out of the API response ({ status, data: { summary } }).
const renderMessageText = (data) => {
  if (data?.status === "success" && typeof data?.data?.summary === "string") {
    const summary = normalizeMarkdownText(data.data.summary).trim();
    if (summary) {
      return summary;
    }
  }
  return "I could not generate a response just now.";
};

const loadStoredMessages = () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch (storageError) {
    console.log(storageError);
    return null;
  }
};

const MoonmindContext = createContext();

export const MoonmindProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(
    () => loadStoredMessages() ?? [MOONMIND_WELCOME],
  );
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY) || generateSessionId();
    } catch (storageError) {
      console.log(storageError);
      return generateSessionId();
    }
  });

  // Persist the conversation + session id across reloads.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (storageError) {
      console.log(storageError);
    }
  }, [messages]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } catch (storageError) {
      console.log(storageError);
    }
  }, [sessionId]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  const sendMessage = async (rawText) => {
    const text = (rawText ?? "").trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
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
      const headers = { "Content-Type": "application/json" };
      if (CHAT_PASSWORD) headers.password = CHAT_PASSWORD;

      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: text,
          sessionId,
          metadata: {},
        }),
      });

      if (!res.ok) throw new Error(`Moonmind API ${res.status}`);

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: renderMessageText(data) },
      ]);
    } catch (err) {
      console.error("Moonmind chat failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong while preparing your response. Please try again.",
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

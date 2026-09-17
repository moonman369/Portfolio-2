import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  isAbortError,
  isMoonmindConfigured,
  isValidSessionId,
  readAnswer,
  RUN_DEADLINE_MS,
  snapshotToPatch,
} from "../lib/moonmindApi";
import { createRunGuard, executeRun } from "../lib/moonmindRun";

const STORAGE_KEY = "portfolio_chat_messages";
const SESSION_STORAGE_KEY = "portfolio_chat_session_id";

export const MOONMIND_WELCOME = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Moonmind 🌙 — Ayan's AI portfolio assistant. Ask me anything about his skills, projects, or experience.",
};

const NOT_CONFIGURED_TEXT =
  "Moonmind isn't wired up yet. Set VITE_PORTFOLIO_API_HOSTNAME and VITE_PORTFOLIO_API_MOONMIND_ENDPOINT in your .env to enable chat.";
const GENERIC_ERROR_TEXT =
  "Sorry, something went wrong while preparing your response. Please try again.";
const TIMEOUT_TEXT =
  "That one is taking longer than expected. Please try asking again.";
const EMPTY_ANSWER_TEXT = "I could not generate a response just now.";

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const loadStoredMessages = () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.length) return null;
    // Ids were added with the agent migration — backfill older conversations.
    return parsed.map((m) => (m?.id ? m : { ...m, id: makeId() }));
  } catch (storageError) {
    console.log(storageError);
    return null;
  }
};

// Keep the stored conversation small: in-flight placeholders are useless after
// a reload, and document bodies would blow the sessionStorage quota. `live`
// marks a message produced by a run in this tab and is deliberately dropped,
// so a restored message with no saved steps shows no steps panel.
const toStoredMessage = (message) => {
  const stored = { ...message };
  delete stored.live;
  if (stored.documents?.length) {
    stored.documents = stored.documents.map(({ id, title, category, tags }) => ({
      id,
      title,
      category,
      tags,
    }));
  } else {
    delete stored.documents;
  }
  return stored;
};

const MoonmindContext = createContext();

export const MoonmindProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(
    () => loadStoredMessages() ?? [MOONMIND_WELCOME],
  );
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return isValidSessionId(stored) ? stored : null;
    } catch (storageError) {
      console.log(storageError);
      return null;
    }
  });

  const [refreshPending, setRefreshPending] = useState(false);

  // The poll loop reads these outside of render.
  const sessionIdRef = useRef(sessionId);
  const abortRef = useRef(null);
  // Hands out a token per run and burns it on refresh. Anything that comes
  // back carrying an older token is dropped on the floor.
  const guardRef = useRef(null);
  if (!guardRef.current) guardRef.current = createRunGuard();

  // Persist the conversation + session id across reloads.
  useEffect(() => {
    try {
      const persistable = messages
        .filter((m) => m.status !== "running")
        .map(toStoredMessage);
      // A chat holding nothing but the welcome message is the first-open
      // state; keep storage empty rather than writing it back.
      const isFirstOpen =
        persistable.length <= 1 && persistable[0]?.id === MOONMIND_WELCOME.id;
      if (isFirstOpen) sessionStorage.removeItem(STORAGE_KEY);
      else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch (storageError) {
      console.log(storageError);
    }
  }, [messages]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
    try {
      if (sessionId) sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      else sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (storageError) {
      console.log(storageError);
    }
  }, [sessionId]);

  // Never leave a poll loop running behind an unmounted provider.
  useEffect(() => () => abortRef.current?.abort(), []);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  const sendMessage = async (rawText) => {
    const text = (rawText ?? "").trim();
    if (!text || loading) return;

    // Everything below belongs to this run. If the chat is refreshed while it
    // is in flight, the token moves on and every late result is discarded.
    const guard = guardRef.current;
    const token = guard.begin();
    const isStale = () => guard.isStale(token);
    // The 130s budget is wall-clock from here — the POST, every poll, and any
    // backoff in between all come out of it.
    const deadlineAt = Date.now() + RUN_DEADLINE_MS;

    const pendingId = makeId();
    setMessages((prev) => [
      ...prev,
      { id: makeId(), role: "user", content: text },
      {
        id: pendingId,
        role: "assistant",
        content: "",
        status: "running",
        live: true,
        steps: [],
      },
    ]);
    setLoading(true);

    // Patch the placeholder in place as the run progresses. A poll that brings
    // nothing new must not re-render the conversation, so an unchanged patch
    // keeps the previous state object.
    const updatePending = (patch) => {
      if (isStale()) return;
      setMessages((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          if (m.id !== pendingId) return m;
          const fields = typeof patch === "function" ? patch(m) : patch;
          if (Object.entries(fields).every(([k, v]) => m[k] === v)) return m;
          changed = true;
          return { ...m, ...fields };
        });
        return changed ? next : prev;
      });
    };

    if (!isMoonmindConfigured) {
      updatePending({ content: NOT_CONFIGURED_TEXT, status: "failed" });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const outcome = await executeRun({
        message: text,
        sessionId: sessionIdRef.current,
        signal: controller.signal,
        deadlineAt,
        guard,
        token,
        // Runs as soon as the 202 lands — and never if a refresh got there
        // first, so a discarded conversation's session is not written back.
        onStarted: (run) => {
          if (isValidSessionId(run?.sessionId)) {
            sessionIdRef.current = run.sessionId;
            setSessionId(run.sessionId);
          }
          updatePending({ runId: run?.runId, sessionId: run?.sessionId });
        },
        onSnapshot: (snapshot) =>
          updatePending((m) => snapshotToPatch(m, snapshot)),
      });

      if (!outcome) return; // Orphaned by a refresh.
      const { final } = outcome;

      // A failed run still carries graceful copy in `answer`; `error` is for
      // the console, not the user.
      if (final?.status === "failed" && final?.error) {
        console.warn("Moonmind run failed:", final.error);
      }
      updatePending((m) => ({
        content: m.content || readAnswer(final?.answer) || EMPTY_ANSWER_TEXT,
        status: final?.status ?? "done",
      }));
    } catch (err) {
      // Aborted or orphaned by a refresh — nothing to report either way.
      if (isStale() || isAbortError(err)) return;
      console.error("Moonmind chat failed:", err);
      const fallback =
        err?.code === "RUN_TIMEOUT" ? TIMEOUT_TEXT : GENERIC_ERROR_TEXT;
      updatePending((m) => ({
        content: m.content || fallback,
        status: "failed",
      }));
    } finally {
      // A stale run must not touch shared state: a newer run may already own
      // the controller and the loading flag.
      if (!isStale()) {
        if (abortRef.current === controller) abortRef.current = null;
        setLoading(false);
      }
    }
  };

  // ---- Refresh chat ----
  // `refreshChat` is what both headers call. It only opens the inline
  // confirmation; `confirmRefresh` does the actual clearing.
  const hasConversation = messages.some((m) => m.role === "user");

  const refreshChat = () => {
    if (!hasConversation) return; // Nothing to clear: no confirmation.
    setRefreshPending(true);
  };

  const cancelRefresh = () => setRefreshPending(false);

  const confirmRefresh = () => {
    // Orphan any run in flight: the token moves, then the request is aborted
    // so the poll loop and its backoff timer stop immediately.
    guardRef.current.invalidate();
    abortRef.current?.abort();
    abortRef.current = null;

    setRefreshPending(false);
    setLoading(false);
    setMessages([MOONMIND_WELCOME]);

    // Drop the session id so the next POST /runs omits it and the server
    // mints a fresh one — the backend keeps conversation state per session.
    sessionIdRef.current = null;
    setSessionId(null);

    // Only MoonMind's own keys. Never clear(), never anyone else's.
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (storageError) {
      console.log(storageError);
    }
  };

  return (
    <MoonmindContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        messages,
        loading,
        sendMessage,
        refreshChat,
        confirmRefresh,
        cancelRefresh,
        refreshPending,
      }}
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

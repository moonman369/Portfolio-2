import { useEffect, useRef, useState } from "react";
import { FileText, Send } from "lucide-react";
import { BiBrain } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/utils";
import { useMoonmind } from "../context/MoonmindContext";
import MoonmindSteps from "./MoonmindSteps";

const MAX_INPUT_HEIGHT = 128;
// How close to the bottom still counts as "following along".
const STICKY_THRESHOLD_PX = 80;

const TypingDots = () => (
  <span className="flex gap-1 py-1">
    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" />
  </span>
);

// Shown once per group of consecutive assistant messages, not on every one.
const AssistantIdentity = () => (
  <div className="flex items-center gap-1.5 mb-1 text-xs text-muted-foreground">
    <span className="grid place-items-center w-5 h-5 rounded-full bg-gradient-primary text-primary-foreground">
      <BiBrain className="text-[11px]" />
    </span>
    <span className="font-medium">Moonmind</span>
  </div>
);

// Retrieved portfolio documents behind an answer. Routes that don't retrieve
// return an empty list, in which case nothing renders.
const MoonmindSources = ({ documents = [] }) => {
  if (!documents.length) return null;

  return (
    <details className="mt-2 rounded-lg border border-border/40 bg-muted/20 text-[11px]">
      <summary className="px-2 py-1 select-none text-muted-foreground hover:text-foreground transition-colors">
        Sources · {documents.length}
      </summary>
      <ul className="px-2 pb-1.5 space-y-0.5">
        {documents.map((doc, i) => (
          <li
            key={doc.id ?? i}
            className="flex items-start gap-1.5 text-muted-foreground"
          >
            <FileText size={11} className="shrink-0 mt-[3px]" />
            <span className="break-words">
              {doc.title || doc.id || "Untitled document"}
              {doc.category && (
                <span className="ml-1.5 text-muted-foreground/60">
                  {doc.category}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
};

const markdownComponents = {
  a: ({ node: _node, children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

// Shared conversation body (message list + input). Reused by the floating
// panel and the full-page view so they share one conversation via context.
const MoonmindChat = ({ className }) => {
  const {
    messages,
    loading,
    sendMessage,
    refreshPending,
    cancelRefresh,
    confirmRefresh,
  } = useMoonmind();
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const cancelRef = useRef(null);
  // Only auto-scroll while the reader is at the bottom; never yank the view
  // away from someone scrolled up reading.
  const stickyRef = useRef(true);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickyRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < STICKY_THRESHOLD_PX;
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (stickyRef.current) scrollToBottom();
  }, [messages, loading]);

  // Auto-grow the textarea up to a cap, then let it scroll.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [input]);

  // Context callbacks are new objects on every render; keep the latest in a ref
  // so the listener below is bound once per open, not once per poll.
  const cancelRefreshRef = useRef(cancelRefresh);
  useEffect(() => {
    cancelRefreshRef.current = cancelRefresh;
  });

  // Move focus into the confirmation as it opens, and let Escape dismiss it.
  useEffect(() => {
    if (!refreshPending) return undefined;
    cancelRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") cancelRefreshRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [refreshPending]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    stickyRef.current = true;
    sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("mm-chat flex flex-col min-h-0", className)}>
      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mm-chat-scroll flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.map((m, i) => {
          const isRunning = m.status === "running";
          const isUser = m.role === "user";
          const startsGroup = !isUser && messages[i - 1]?.role !== m.role;

          return (
            <div
              key={m.id ?? i}
              className={cn("flex", isUser ? "justify-end" : "justify-start")}
            >
              {isUser ? (
                <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-br-sm bg-primary/10 border border-primary/20 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {m.content}
                </div>
              ) : (
                <div className="w-full max-w-[65ch] min-w-0">
                  {startsGroup && <AssistantIdentity />}

                  {/* Thinking steps: shown for every message produced by a
                      run in this tab, and for restored messages that still
                      carry steps. Keyed by runId so state can never carry
                      over into a new conversation. */}
                  {(m.live || m.steps?.length > 0) && (
                    <MoonmindSteps
                      key={m.runId ?? m.id}
                      steps={m.steps}
                      isRunning={isRunning}
                      className={m.content ? "mb-2" : ""}
                    />
                  )}

                  {m.content ? (
                    <div className="chat-markdown text-sm leading-relaxed break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    isRunning && !m.live && <TypingDots />
                  )}

                  <MoonmindSources documents={m.documents} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Refresh confirmation — inline, never window.confirm */}
      {refreshPending && (
        <div
          role="alertdialog"
          aria-label="Start a new chat"
          className="shrink-0 border-t border-border/50 bg-muted/30 px-3 py-2.5 flex flex-wrap items-center gap-2"
        >
          <p className="flex-1 min-w-[10rem] text-xs text-muted-foreground">
            Start a new chat? This clears the current conversation.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              ref={cancelRef}
              onClick={cancelRefresh}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs border border-border",
                "hover:bg-muted/60 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
              )}
            >
              Cancel
            </button>
            <button
              onClick={confirmRefresh}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs bg-gradient-primary text-primary-foreground",
                "transition-all hover:btn-glow",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
              )}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Input (fixed) */}
      <div className="shrink-0 border-t border-border/50 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background/60 px-2 py-1.5 focus-within:border-primary/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask Moonmind anything…"
            className="mm-chat-input flex-1 resize-none bg-transparent px-1.5 py-1 text-sm leading-relaxed focus:outline-hidden placeholder:text-muted-foreground/70"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className={cn(
              "shrink-0 p-2 rounded-xl bg-gradient-primary text-primary-foreground transition-all",
              "disabled:opacity-40 enabled:hover:btn-glow",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoonmindChat;

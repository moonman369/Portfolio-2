import { useEffect, useRef, useState } from "react";
import { FileText, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/utils";
import { MOONMIND_WELCOME, useMoonmind } from "../context/MoonmindContext";
import {
  MOONMIND_STARTERS,
  MOONMIND_STARTERS_LABEL,
} from "../context/constants";
import MoonmindSteps from "./MoonmindSteps";
import MoonMark from "./MoonMark";

const MAX_INPUT_HEIGHT = 128;
// How close to the bottom still counts as "following along".
const STICKY_THRESHOLD_PX = 80;

// Thinking: the same glowing orb as the steps header (see .mm-orb). Part of
// the running state, the one place a loop is allowed; still with reduced
// motion.
const TypingDots = () => (
  <span className="flex py-2.5 pl-1" aria-hidden="true">
    <span className="mm-orb mm-orb-lg" />
  </span>
);

// Shown once per group of consecutive assistant messages, not on every one.
const AssistantIdentity = () => (
  <div className="flex items-center gap-2 mb-1.5 font-mono text-xs text-muted-foreground">
    <MoonMark size={14} className="text-primary" />
    <span>Moonmind</span>
  </div>
);

// Retrieved portfolio documents behind an answer. Routes that don't retrieve
// return an empty list, in which case nothing renders.
const MoonmindSources = ({ documents = [] }) => {
  if (!documents.length) return null;

  return (
    <details className="mm-sources mt-3 text-xs">
      <summary className="inline-flex min-h-8 items-center gap-2 rounded-full px-3 font-mono text-muted-foreground ring-1 ring-inset ring-border select-none hover:text-foreground">
        Sources · {documents.length}
      </summary>
      {/* Chips stagger in when the disclosure opens (see .mm-sources). */}
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {documents.map((doc, i) => (
          <li
            key={doc.id ?? i}
            style={{ "--i": i }}
            className="mm-chip inline-flex max-w-full items-start gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-muted-foreground"
          >
            <FileText size={12} className="shrink-0 mt-[2px]" aria-hidden="true" />
            <span className="break-words">
              {doc.title || doc.id || "Untitled document"}
              {doc.category && (
                <span className="ml-1.5 font-mono text-muted-foreground">
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

// Starter questions under the greeting of an empty chat. A tap sends the
// question through the same path as typing it; nothing is sent until then.
// They go once the conversation has a user message, and are disabled while
// a reply is loading.
const StarterChips = ({ disabled, onPick }) => (
  <div
    role="group"
    aria-label={MOONMIND_STARTERS_LABEL}
    className="mm-starters flex flex-wrap gap-2 pt-1"
  >
    {MOONMIND_STARTERS.map((question, i) => (
      <button
        key={question}
        type="button"
        disabled={disabled}
        onClick={() => onPick(question)}
        style={{ "--i": i }}
        className="mm-starter min-h-11 rounded-full px-4 text-left text-sm text-foreground ring-1 ring-inset ring-primary/35 bg-primary/8 hover:bg-primary/15 disabled:opacity-50"
      >
        {question}
      </button>
    ))}
  </div>
);

const markdownComponents = {
  a: ({ children, ...props }) => {
    // react-markdown passes its AST node too; it is not an HTML attribute.
    const { node: _node, ...anchorProps } = props;
    return (
      <a {...anchorProps} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
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

  // A starter goes the same way as a typed question.
  const sendStarter = (question) => {
    if (loading) return;
    stickyRef.current = true;
    sendMessage(question);
  };
  const onlyGreeting =
    messages.length === 1 && messages[0].id === MOONMIND_WELCOME.id;

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
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-primary/12 ring-1 ring-inset ring-primary/25 text-[0.9375rem] leading-relaxed text-foreground whitespace-pre-wrap break-words">
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
                      route={m.route}
                      status={m.status}
                      className={m.content ? "mb-3" : ""}
                    />
                  )}

                  {m.content ? (
                    <div className="chat-markdown text-[0.9375rem] leading-relaxed text-foreground break-words">
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

        {onlyGreeting && (
          <StarterChips disabled={loading} onPick={sendStarter} />
        )}
      </div>

      {/* Refresh confirmation — inline, never window.confirm */}
      {refreshPending && (
        <div
          role="alertdialog"
          aria-label="Start a new chat"
          className="shrink-0 border-t border-border bg-muted/50 px-4 py-2 flex flex-wrap items-center gap-2"
        >
          <p className="flex-1 min-w-[10rem] text-sm text-foreground">
            Start a new chat? This clears the current conversation.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              ref={cancelRef}
              onClick={cancelRefresh}
              className={cn(
                "min-h-11 px-4 rounded-md text-sm font-medium text-foreground",
                "ring-1 ring-inset ring-input hover:bg-muted",
              )}
            >
              Cancel
            </button>
            <button
              onClick={confirmRefresh}
              className={cn(
                "min-h-11 px-4 rounded-md text-sm font-medium",
                "bg-primary text-primary-foreground hover:opacity-90",
              )}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Input (fixed) */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-input bg-background pl-2 pr-1.5 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask Moonmind anything…"
            className="mm-chat-input flex-1 self-center resize-none bg-transparent px-2 py-1.5 text-base leading-relaxed text-foreground focus:outline-hidden placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className={cn(
              "shrink-0 grid place-items-center size-11 rounded-xl",
              "bg-primary text-primary-foreground",
              "transition-transform duration-(--motion-fast) ease-moon-out",
              "enabled:hover:-translate-y-px enabled:active:translate-y-0",
              "disabled:opacity-40",
            )}
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoonmindChat;

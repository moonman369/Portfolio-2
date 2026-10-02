import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Check, Copy, FileText, RotateCw, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { waapi } from "animejs/waapi";
import { cn } from "../lib/utils";
import { MOONMIND_WELCOME, useMoonmind } from "../context/MoonmindContext";
import {
  MOONMIND_CHAT_CLEARED,
  MOONMIND_COPIED,
  MOONMIND_COPY_LABEL,
  MOONMIND_JUMP_LATEST,
  MOONMIND_LOG_LABEL,
  MOONMIND_NEW_CHAT_STARTED,
  MOONMIND_START_NEW_CHAT,
  MOONMIND_STARTERS,
  MOONMIND_STARTERS_LABEL,
  MOONMIND_STATUS_READY,
  MOONMIND_STATUS_WORKING,
  MOONMIND_TRY_AGAIN,
  MOONMIND_UNDO,
  MOONMIND_WAIT_LONG,
  MOONMIND_WAIT_SLOW,
} from "../context/constants";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { isMoonmindConfigured } from "../lib/moonmindApi";
import { EASE } from "../lib/motion";
import { messageTop, scrollListTo } from "../lib/moonmindScroll";
import { listMemory, viewReady } from "../lib/moonmindView";
import MoonmindSteps from "./MoonmindSteps";
import MoonMark from "./MoonMark";

const MAX_INPUT_HEIGHT = 128;
// How close to the bottom still counts as "following along".
const STICKY_THRESHOLD_PX = 80;
// An answer taller than this share of the list is read from its start.
const LONG_ANSWER_SHARE = 0.6;
const COPIED_MS = 1500;
// Nothing shows for the first moments of a run, so a quick one never
// flashes a placeholder.
const WAIT_HOLD_MS = 300;
// The one reassurance line, only when waiting is long.
const WAIT_NOTES = [
  [20_000, MOONMIND_WAIT_LONG],
  [6_000, MOONMIND_WAIT_SLOW],
];
// Answer entrance: each block fades and rises 8px, 40ms apart, all of it
// within 400ms.
const ENTER_MS = 240;
const ENTER_STEP_MS = 40;
const ENTER_MAX_DELAY_MS = 160;

// When each run was first seen running, by message id. Module scope, so a
// view switch mid-run keeps counting from the real start.
const runStartedAt = new Map();
const startOf = (id) => {
  if (!runStartedAt.has(id)) runStartedAt.set(id, Date.now());
  return runStartedAt.get(id);
};

// While a run is going and before its text: one calm line if it is slow,
// then the space the answer will take (three soft lines that breathe once
// every 2s). The answer replaces them in place. Decorative for screen
// readers, which hear the chat's status instead.
const Waiting = ({ id }) => {
  const [shown, setShown] = useState(
    () => Date.now() - startOf(id) >= WAIT_HOLD_MS,
  );
  useEffect(() => {
    if (shown) return undefined;
    const timer = setTimeout(() => setShown(true), WAIT_HOLD_MS);
    return () => clearTimeout(timer);
  }, [shown]);
  const [now, setNow] = useState(() => Date.now());
  const elapsed = now - startOf(id);
  const note = WAIT_NOTES.find(([after]) => elapsed >= after)?.[1];

  useEffect(() => {
    const next = WAIT_NOTES.map(([after]) => after)
      .filter((after) => after > elapsed)
      .sort((a, b) => a - b)[0];
    if (next == null) return undefined;
    const timer = setTimeout(() => setNow(Date.now()), next - elapsed + 20);
    return () => clearTimeout(timer);
  }, [elapsed]);

  if (!shown) return null;
  return (
    <div aria-hidden="true" className="mm-waiting">
      {note && (
        <p className="mb-2.5 text-sm text-muted-foreground">{note}</p>
      )}
      <div className="mm-skeleton space-y-2.5 pb-1">
        <span className="block h-3 w-[90%] rounded-full" />
        <span className="block h-3 w-[75%] rounded-full" />
        <span className="block h-3 w-[55%] rounded-full" />
      </div>
    </div>
  );
};

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
      <summary className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-mono text-muted-foreground ring-1 ring-inset ring-border select-none hover:text-foreground">
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

// Copy an answer as plain text: the rendered text, not the markdown.
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers, or no clipboard permission.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
};

// Under a finished answer: a quiet Copy button. On desktop it shows on hover
// or focus of its message; on touch it is always there (see .mm-actions).
// "Copied" is announced through the chat's status, not from here, so the log
// never reads it out as part of a message.
const AnswerActions = ({ onCopied }) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async (event) => {
    const answer = event.currentTarget
      .closest("[data-msg-id]")
      ?.querySelector(".chat-markdown");
    if (!answer || !(await copyText(answer.innerText.trim()))) return;
    setCopied(true);
    onCopied();
  };

  return (
    <div
      aria-live="off"
      data-active={copied || undefined}
      className="mm-actions -ml-2.5 mt-1 flex items-center"
    >
      <button
        type="button"
        onClick={copy}
        aria-label={MOONMIND_COPY_LABEL}
        title={MOONMIND_COPY_LABEL}
        className="icon-btn text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
      </button>
      {copied && (
        <span aria-hidden="true" className="font-mono text-xs text-muted-foreground">
          {MOONMIND_COPIED}
        </span>
      )}
    </div>
  );
};

// Starter questions under the greeting of an empty chat. A tap sends the
// question through the same path as typing it; nothing is sent until then.
// They go once the conversation has a user message, and are disabled while
// a reply is loading. A long one wraps onto a second line inside a taller
// pill rather than squeezing into a 44px one.
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
        className="mm-starter min-h-11 rounded-3xl px-4 py-2.5 text-left text-sm leading-snug text-balance text-foreground ring-1 ring-inset ring-primary/35 bg-primary/8 hover:bg-primary/15 disabled:opacity-50"
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

// Touch screens: focusing the input would open the on-screen keyboard.
const coarsePointer = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

const findMessage = (list, id) =>
  list?.querySelector(`[data-msg-id="${CSS.escape(String(id))}"]`);

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
    canUndo,
    undoRefresh,
  } = useMoonmind();
  const reducedMotion = usePrefersReducedMotion();
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const cancelRef = useRef(null);
  // Only auto-scroll while the reader is at the bottom; never yank the view
  // away from someone scrolled up reading.
  const stickyRef = useRef(true);
  // An answer that arrived while the reader was scrolled up: the pill takes
  // them to its start.
  const [jumpTo, setJumpTo] = useState(null);
  // The visually hidden status: "Working…", "Answer ready", "Copied".
  const [status, setStatus] = useState("");
  // Cleared first, so the same words twice are read twice.
  const announce = (text) => {
    requestAnimationFrame(() => {
      setStatus("");
      setTimeout(() => setStatus(text), 50);
    });
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) scrollListTo(el, el.scrollHeight);
    });
  };

  const fromBottom = (el) => el.scrollHeight - el.scrollTop - el.clientHeight;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    listMemory.fromBottom = fromBottom(el);
    stickyRef.current = listMemory.fromBottom < STICKY_THRESHOLD_PX;
    if (stickyRef.current) setJumpTo(null);
  };

  // Mounting in a view (panel or full page): put the reader back where they
  // were in the other one, instantly and before the first paint. At the
  // bottom stays at the bottom; higher up keeps the same distance from it.
  // Then let a view transition capture this view (lib/moonmindView.js).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const atBottom = listMemory.fromBottom < STICKY_THRESHOLD_PX;
    el.scrollTop = atBottom
      ? el.scrollHeight
      : el.scrollHeight - el.clientHeight - listMemory.fromBottom;
    stickyRef.current = atBottom;
    viewReady();
    return () => {
      listMemory.fromBottom = fromBottom(el);
    };
  }, []);

  const scrollToMessage = (id) => {
    const list = scrollRef.current;
    const message = findMessage(list, id);
    if (!message) return;
    scrollListTo(list, messageTop(list, message), { smooth: !reducedMotion });
  };

  // An answer arriving. Each assistant message from a run is seen first
  // without its text and then with it; that moment is the arrival. Messages
  // already complete when the list mounts never count, so switching views or
  // reopening the panel moves nothing.
  //   following along, short answer   stay at the bottom (as before)
  //   following along, long answer    show it from its start, 12px below
  //                                   the top of the list
  //   scrolled up                     leave them be; offer the pill
  const textSeenRef = useRef(null);
  useLayoutEffect(() => {
    const seen = textSeenRef.current;
    textSeenRef.current = new Map(messages.map((m) => [m.id, Boolean(m.content)]));
    if (!seen) return;
    const arrived = messages.findLast(
      (m) => m.role === "assistant" && m.content && seen.get(m.id) === false,
    );
    const list = scrollRef.current;
    if (!arrived || !list) return;
    // The answer comes in block by block (paragraphs, lists, headings): a
    // fade and an 8px rise, 40ms apart, done within 400ms. Never a
    // typewriter; nothing with reduced motion. Before the first paint, so
    // the text never shows before its entrance.
    const blocks = findMessage(list, arrived.id)?.querySelector(".chat-markdown")?.children;
    if (blocks?.length && !reducedMotion) {
      waapi.animate(blocks, {
        opacity: [0, 1],
        transform: ["translateY(8px)", "translateY(0px)"],
        duration: ENTER_MS,
        delay: (_, index) => Math.min(index * ENTER_STEP_MS, ENTER_MAX_DELAY_MS),
        ease: EASE.out,
      });
    }
    if (!stickyRef.current) {
      requestAnimationFrame(() => setJumpTo(arrived.id));
      return;
    }
    const message = findMessage(list, arrived.id);
    const answer = message?.querySelector(".chat-markdown");
    if (!answer || answer.offsetHeight < list.clientHeight * LONG_ANSWER_SHARE) {
      return;
    }
    // Read it from the top. No longer following the bottom, so the
    // follow-scroll below leaves it there.
    stickyRef.current = false;
    scrollListTo(list, messageTop(list, message), { smooth: !reducedMotion });
  }, [messages, reducedMotion]);

  // Screen readers hear the final answer (through the log) and two short
  // statuses, never each step. A failure is read from the log on its own.
  const wasLoadingRef = useRef(loading);
  const failed = messages[messages.length - 1]?.status === "failed";
  useEffect(() => {
    if (loading === wasLoadingRef.current) return;
    wasLoadingRef.current = loading;
    if (loading) announce(MOONMIND_STATUS_WORKING);
    else if (!failed) announce(MOONMIND_STATUS_READY);
  }, [loading, failed]);

  // Desktop: ready to type. Touch: no autofocus (the keyboard would cover
  // the starter chips); the input focuses when tapped.
  useEffect(() => {
    if (!coarsePointer()) inputRef.current?.focus();
  }, []);

  // When the list gets shorter (the on-screen keyboard opening, a resize),
  // a reader at the bottom stays at the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      if (stickyRef.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (stickyRef.current) scrollToBottom();
  }, [messages, loading]);

  // Auto-grow the textarea up to a cap, then let it scroll. Empty, it is
  // its natural one line (no measuring: a placeholder measured before the
  // layout or the fonts settle once made it 128px tall). Measured again
  // once the fonts are ready.
  const fitInput = () => {
    const el = inputRef.current;
    if (!el) return;
    if (!el.value) {
      el.style.height = "";
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  };
  useEffect(fitInput, [input]);
  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => live && fitInput());
    return () => {
      live = false;
    };
  }, []);

  // After "Start new chat": focus the input on desktop; on touch, the
  // greeting (so the keyboard stays down); and say so. Undo puts focus back
  // in the same way, on the conversation it restored.
  const [cleared, setCleared] = useState(0);
  const startNewChat = () => {
    confirmRefresh();
    setCleared((n) => n + 1);
  };
  useEffect(() => {
    if (!cleared) return;
    if (coarsePointer()) findMessage(scrollRef.current, MOONMIND_WELCOME.id)?.focus();
    else inputRef.current?.focus();
    announce(MOONMIND_NEW_CHAT_STARTED);
  }, [cleared]);
  const undo = () => {
    undoRefresh();
    if (coarsePointer()) scrollRef.current?.focus();
    else inputRef.current?.focus();
  };

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
    setJumpTo(null);
    sendMessage(text);
  };

  // A starter, or "Try again", goes the same way as a typed question.
  const send = (question) => {
    if (loading) return;
    stickyRef.current = true;
    setJumpTo(null);
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
      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* Messages. A log: screen readers hear what is added (questions
            and final answers); the steps panel inside opts out and the
            run's progress goes to the status below instead. */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label={MOONMIND_LOG_LABEL}
          tabIndex={-1}
          className="mm-chat-scroll flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3"
        >
          {messages.map((m, i) => {
            const isRunning = m.status === "running";
            const isUser = m.role === "user";
            const startsGroup = !isUser && messages[i - 1]?.role !== m.role;
            const finishedAnswer =
              !isUser &&
              Boolean(m.content) &&
              !isRunning &&
              m.status !== "failed" &&
              m.id !== MOONMIND_WELCOME.id;
            // A failed last answer offers to ask the same question again
            // (pointless when the chat is not configured at all).
            const retryQuestion =
              m.status === "failed" &&
              i === messages.length - 1 &&
              !loading &&
              isMoonmindConfigured
                ? messages.findLast((q, j) => j < i && q.role === "user")?.content
                : null;

            return (
              <div
                key={m.id ?? i}
                data-msg-id={m.id}
                tabIndex={m.id === MOONMIND_WELCOME.id ? -1 : undefined}
                className={cn("mm-msg flex", isUser ? "justify-end" : "justify-start")}
              >
                {isUser ? (
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-primary/12 text-[0.9375rem] leading-relaxed text-foreground whitespace-pre-wrap break-words">
                    {m.content}
                  </div>
                ) : (
                  <div className="w-full max-w-[65ch] min-w-0">
                    {startsGroup && <AssistantIdentity />}

                    {/* Thinking steps: shown for every message produced by
                        a run in this tab, and for restored messages that
                        still carry steps. Keyed by runId so state can never
                        carry over into a new conversation. */}
                    {/* A failed answer is only its sentence and "Try
                        again". */}
                    {(m.live || m.steps?.length > 0) &&
                      m.status !== "failed" && (
                      <div aria-live="off">
                        <MoonmindSteps
                          key={m.runId ?? m.id}
                          steps={m.steps}
                          isRunning={isRunning}
                          route={m.route}
                          status={m.status}
                          className={m.content || isRunning ? "mb-3" : ""}
                        />
                      </div>
                    )}

                    {m.content ? (
                      <div className="chat-markdown text-[0.9375rem] text-foreground break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      isRunning && <Waiting id={m.id} />
                    )}

                    <MoonmindSources documents={m.documents} />
                    {finishedAnswer && (
                      <AnswerActions onCopied={() => announce(MOONMIND_COPIED)} />
                    )}
                    {retryQuestion && (
                      <button
                        type="button"
                        onClick={() => send(retryQuestion)}
                        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-medium text-foreground ring-1 ring-inset ring-input hover:bg-muted"
                      >
                        <RotateCw size={16} aria-hidden="true" />
                        {MOONMIND_TRY_AGAIN}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {onlyGreeting && (
            <StarterChips disabled={loading} onPick={send} />
          )}
        </div>

        {/* An answer arrived while the reader was scrolled up. */}
        {jumpTo && (
          <button
            type="button"
            onClick={() => {
              scrollToMessage(jumpTo);
              setJumpTo(null);
            }}
            className="mm-jump absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-card px-4 text-sm font-medium text-foreground shadow-lg ring-1 ring-inset ring-border hover:text-ink"
          >
            {MOONMIND_JUMP_LATEST}
            <ArrowDown size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <p role="status" className="sr-only">
        {status}
      </p>

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
          {/* Cancel first and clearly visible; the destructive choice is a
              plain primary button that says what it does. */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              ref={cancelRef}
              onClick={cancelRefresh}
              className={cn(
                "min-h-11 px-4 rounded-md text-sm font-medium text-foreground",
                "bg-background ring-1 ring-inset ring-input hover:bg-muted",
              )}
            >
              Cancel
            </button>
            <button
              onClick={startNewChat}
              className={cn(
                "min-h-11 px-4 rounded-md text-sm font-normal",
                "bg-primary text-primary-foreground hover:opacity-90",
              )}
            >
              {MOONMIND_START_NEW_CHAT}
            </button>
          </div>
        </div>
      )}

      {/* Just cleared: a few seconds to change their mind. */}
      {canUndo && (
        <div className="shrink-0 flex items-center justify-center gap-1 border-t border-border px-4 text-sm text-muted-foreground">
          <span>{MOONMIND_CHAT_CLEARED}</span>
          <button
            type="button"
            onClick={undo}
            className="min-h-11 rounded-md px-2 font-medium text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
          >
            {MOONMIND_UNDO}
          </button>
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
            enterKeyHint="send"
            placeholder="Ask Moonmind anything…"
            className="mm-chat-input flex-1 self-center min-h-11 resize-none bg-transparent px-2 py-[9px] text-base leading-relaxed text-foreground focus:outline-hidden placeholder:text-muted-foreground"
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

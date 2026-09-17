import { useEffect, useRef, useState } from "react";
import { FileText, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/utils";
import { useMoonmind } from "../context/MoonmindContext";
import MoonmindSteps from "./MoonmindSteps";

const TypingDots = () => (
  <span className="flex gap-1 py-1">
    <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
    <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
    <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" />
  </span>
);

// Retrieved portfolio documents behind an answer. Routes that don't retrieve
// return an empty list, in which case nothing renders.
const MoonmindSources = ({ documents = [] }) => {
  if (!documents.length) return null;

  return (
    <details className="mt-2 rounded-xl border border-border/50 bg-background/40 text-xs">
      <summary className="px-2.5 py-1.5 cursor-pointer select-none text-muted-foreground">
        Sources · {documents.length}
      </summary>
      <ul className="px-2.5 pb-2 space-y-1">
        {documents.map((doc, i) => (
          <li
            key={doc.id ?? i}
            className="flex items-start gap-1.5 text-muted-foreground"
          >
            <FileText size={11} className="shrink-0 mt-0.5" />
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

// Shared conversation body (message list + input). Reused by the floating
// panel and the full-page view so they share one conversation via context.
const MoonmindChat = ({ className }) => {
  const { messages, loading, sendMessage } = useMoonmind();
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((m, i) => {
          const isRunning = m.status === "running";
          return (
            <div
              key={m.id ?? i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] px-3.5 py-2 rounded-2xl text-sm break-words",
                  m.role === "user"
                    ? "bg-gradient-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap"
                    : "bg-card/70 text-foreground border border-border/50 rounded-bl-sm",
                )}
              >
                {m.role === "assistant" ? (
                  <>
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
                      <div className="chat-markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node: _node, children, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      isRunning && !m.live && <TypingDots />
                    )}

                    <MoonmindSources documents={m.documents} />
                  </>
                ) : (
                  m.content
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input (fixed) */}
      <div className="shrink-0 p-3 border-t border-border/50 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask Moonmind anything…"
          className="flex-1 resize-none max-h-24 px-3 py-2 rounded-xl bg-background/60 border border-border focus:outline-hidden focus:ring-2 focus:ring-primary text-sm"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="p-2.5 rounded-xl bg-gradient-primary text-primary-foreground shrink-0 transition-all disabled:opacity-50 enabled:hover:btn-glow"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default MoonmindChat;

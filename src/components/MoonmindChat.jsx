import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { cn } from "../lib/utils";
import { useMoonmind } from "../context/MoonmindContext";

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words",
                m.role === "user"
                  ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                  : "bg-card/70 text-foreground border border-border/50 rounded-bl-sm",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-3.5 py-3 rounded-2xl bg-card/70 border border-border/50 rounded-bl-sm">
              <span className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/50 flex items-end gap-2">
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

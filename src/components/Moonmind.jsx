import { Suspense, useRef } from "react";
import { Maximize2, RotateCcw, X } from "lucide-react";
import { BiBrain } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { headerActionClass } from "../lib/moonmindUi";
import { MoonmindChatLazy, moonmindIntentProps } from "../lib/lazyChat";
import { useMoonmind } from "../context/MoonmindContext";
import { useVisualViewportVars } from "../hooks/useVisualViewportVars";
import GlowBeam from "./GlowBeam";
import MoonMark from "./MoonMark";

// Shown for the moment it takes to fetch the chat chunk the first time.
const ChatLoading = () => (
  <div role="status" className="flex-1 min-h-0 grid place-items-center">
    <span className="flex gap-1" aria-hidden="true">
      <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
    </span>
    <span className="sr-only">Loading Moonmind</span>
  </div>
);

const Moonmind = () => {
  const { isOpen, open, close, refreshChat, refreshPending } = useMoonmind();
  const navigate = useNavigate();
  const location = useLocation();
  // Keeps the mobile panel (and its input) inside the visible area when the
  // on-screen keyboard opens.
  const panelRef = useRef(null);
  useVisualViewportVars(panelRef, isOpen);

  const expand = () =>
    navigate("/moonmind", {
      state: { from: `${location.pathname}${location.hash}`, internal: true },
    });

  return (
    <>
      {/* Floating bot button (desktop only) — shown when the chat is closed */}
      {!isOpen && (
        <button
          onClick={open}
          {...moonmindIntentProps}
          aria-label="Open Moonmind chat"
          aria-expanded={isOpen}
          title="Moonmind AI"
          className={cn(
            "mm-launcher max-sm:hidden fixed z-50",
            "right-[max(1.5rem,env(safe-area-inset-right))] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
            "btn-glow grid place-items-center size-14 rounded-full",
            "bg-card text-primary shadow-lg [--glow-face:hsl(var(--card))]",
          )}
        >
          <GlowBeam />
          <MoonMark size={26} />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className={cn(
            "mm-panel fixed z-[60] flex flex-col overflow-hidden rounded-2xl animate-fade-in",
            "bg-background border border-border shadow-xl",
            "sm:inset-auto sm:right-[max(1.5rem,env(safe-area-inset-right))] sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
            "sm:w-96 sm:h-[600px] sm:max-h-[80vh]",
          )}
          role="dialog"
          aria-label="Moonmind AI assistant"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border bg-card">
            <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-gradient-primary text-primary-foreground">
              <BiBrain className="text-lg" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Moonmind AI</p>
              <p className="text-xs text-muted-foreground leading-tight truncate">
                Ayan's portfolio assistant
              </p>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={refreshChat}
                disabled={refreshPending}
                aria-label="Refresh chat"
                title="Refresh chat"
                className={headerActionClass}
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={expand}
                aria-label="Expand to full page"
                title="Expand"
                className={headerActionClass}
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={close}
                aria-label="Close Moonmind"
                title="Close"
                className={headerActionClass}
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <Suspense fallback={<ChatLoading />}>
            <MoonmindChatLazy className="flex-1 min-h-0" />
          </Suspense>
        </div>
      )}
    </>
  );
};

export default Moonmind;

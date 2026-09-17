import { Maximize2, RotateCcw, X } from "lucide-react";
import { BiBrain } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { headerActionClass } from "../lib/moonmindUi";
import { useMoonmind } from "../context/MoonmindContext";
import MoonmindChat from "./MoonmindChat";

const Moonmind = () => {
  const { isOpen, open, close, refreshChat, refreshPending } = useMoonmind();
  const navigate = useNavigate();
  const location = useLocation();

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
          aria-label="Open Moonmind chat"
          aria-expanded={isOpen}
          title="Moonmind AI"
          className={cn(
            "mm-launcher max-sm:hidden fixed z-50 bottom-6 right-6",
            "p-4 rounded-full bg-gradient-primary text-primary-foreground",
            "shadow-lg animate-moonmind-glow",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          )}
        >
          <BiBrain className="text-2xl" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-[60] flex flex-col overflow-hidden rounded-2xl animate-fade-in",
            "bg-background/95 backdrop-blur-xl border border-border/60 shadow-xl",
            "inset-x-4 bottom-24 top-20",
            "sm:inset-auto sm:top-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] sm:max-h-[80vh]",
          )}
          role="dialog"
          aria-label="Moonmind AI assistant"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border/60 bg-card/40">
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

          <MoonmindChat className="flex-1 min-h-0" />
        </div>
      )}
    </>
  );
};

export default Moonmind;

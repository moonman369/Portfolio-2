import { Maximize2, X } from "lucide-react";
import { BiBrain } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useMoonmind } from "../context/MoonmindContext";
import MoonmindChat from "./MoonmindChat";

const Moonmind = () => {
  const { isOpen, open, close } = useMoonmind();
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
          aria-label="Open Moonmind AI"
          title="Moonmind AI"
          className={cn(
            "max-sm:hidden fixed z-50 bottom-6 right-6",
            "p-4 rounded-full bg-gradient-primary text-primary-foreground",
            "shadow-lg animate-moonmind-glow",
          )}
        >
          <BiBrain className="text-2xl" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-[60] flex flex-col overflow-hidden rounded-2xl shadow-2xl animate-fade-in",
            "bg-background/95 backdrop-blur-xl border border-border/60",
            "inset-x-4 bottom-24 top-20",
            "sm:inset-auto sm:top-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] sm:max-h-[80vh]",
          )}
          role="dialog"
          aria-label="Moonmind AI assistant"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-primary text-primary-foreground">
            <BiBrain className="text-2xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-tight">Moonmind AI</p>
              <p className="text-xs opacity-80 leading-tight">
                Ayan's portfolio assistant
              </p>
            </div>
            <button
              onClick={expand}
              aria-label="Expand to full page"
              title="Expand"
              className="p-1 rounded-full hover:bg-black/15 transition-colors"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={close}
              aria-label="Close Moonmind"
              title="Close"
              className="p-1 rounded-full hover:bg-black/15 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <MoonmindChat className="flex-1 min-h-0" />
        </div>
      )}
    </>
  );
};

export default Moonmind;

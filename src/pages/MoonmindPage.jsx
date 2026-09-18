import { Minimize2, RotateCcw } from "lucide-react";
import { BiBrain } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { headerActionClass } from "../lib/moonmindUi";
import { useMoonmind } from "../context/MoonmindContext";
import { useTheme } from "../context/ThemeContext";
import StarBackground from "../components/StarBackground";
import LightModeBackground from "../components/LightModeBackground";
import MoonmindChat from "../components/MoonmindChat";

const MoonmindPage = () => {
  const { isDarkMode } = useTheme();
  const { refreshChat, refreshPending } = useMoonmind();
  const navigate = useNavigate();
  const location = useLocation();

  // Return to wherever the chat was expanded from (preserving scroll/section).
  // A direct load or a reload of /moonmind carries no internal state and has
  // no entry of ours to go back to, so it falls through to home rather than
  // stepping out of the site.
  const minimize = () => {
    if (location.state?.internal) {
      navigate(-1);
      return;
    }
    navigate(location.state?.from || "/");
  };

  return (
    <div className="h-[100dvh] text-foreground relative flex flex-col overflow-hidden">
      {/* Same background as the site */}
      {isDarkMode ? <StarBackground /> : <LightModeBackground />}

      <div className="relative z-10 flex-1 min-h-0 flex flex-col w-full max-w-3xl mx-auto p-4">
        {/* Header (fixed) */}
        <div className="flex items-center gap-3 py-4 shrink-0">
          <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-gradient-primary text-primary-foreground">
            <BiBrain className="text-xl" />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight">
              <span className="text-gradient">Moonmind AI</span>
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              Ayan's portfolio assistant
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={refreshChat}
              disabled={refreshPending}
              aria-label="Refresh chat"
              title="Refresh chat"
              className={headerActionClass}
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={minimize}
              aria-label="Minimize to portfolio"
              title="Minimize"
              className={cn(
                headerActionClass,
                "sm:inline-flex sm:items-center sm:gap-2 sm:px-4 sm:py-2 sm:rounded-full",
                "sm:border sm:border-primary/50 sm:bg-primary/10 sm:text-primary",
                "sm:hover:bg-primary/20 sm:hover:text-primary sm:text-sm sm:hover:btn-glow",
              )}
            >
              <Minimize2 size={16} />
              <span className="max-sm:hidden">Minimize</span>
            </button>
          </div>
        </div>

        {/* Chat container — only the messages scroll; header + input stay put */}
        <div className="flex-1 min-h-0 mb-4 rounded-2xl overflow-hidden flex flex-col bg-background/80 backdrop-blur-xl border border-border/60 shadow-lg">
          <MoonmindChat className="flex-1 min-h-0" />
        </div>
      </div>
    </div>
  );
};

export default MoonmindPage;

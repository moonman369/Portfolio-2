import { Minimize2, RotateCcw } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { headerActionClass } from "../lib/moonmindUi";
import { useMoonmind } from "../context/MoonmindContext";
import { useTheme } from "../context/ThemeContext";
import StarBackground from "../components/StarBackground";
import LightModeBackground from "../components/LightModeBackground";
import MoonmindChat from "../components/MoonmindChat";
import MoonMark from "../components/MoonMark";

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

      <div className="relative z-10 flex-1 min-h-0 flex flex-col w-full max-w-3xl mx-auto px-[max(1rem,env(safe-area-inset-left))] pt-[env(safe-area-inset-top)]">
        {/* Header (fixed) */}
        <div className="paper-scrim flex items-center gap-3 py-4 shrink-0 text-left">
          <span className="grid place-items-center size-11 shrink-0 rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
            <MoonMark size={24} />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">
              Moonmind AI
            </h1>
            <p className="font-mono text-xs text-muted-foreground truncate">
              Ayan's portfolio assistant
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refreshChat}
              disabled={refreshPending}
              aria-label="Refresh chat"
              title="Refresh chat"
              className={headerActionClass}
            >
              <RotateCcw size={17} aria-hidden="true" />
            </button>
            <button
              onClick={minimize}
              aria-label="Minimize to portfolio"
              title="Minimize"
              className={cn(
                headerActionClass,
                "sm:w-auto sm:inline-flex sm:items-center sm:gap-2 sm:px-4 sm:rounded-full",
                "sm:text-sm sm:font-medium sm:text-foreground sm:ring-1 sm:ring-inset sm:ring-input",
              )}
            >
              <Minimize2 size={17} aria-hidden="true" />
              <span className="max-sm:hidden">Minimize</span>
            </button>
          </div>
        </div>

        {/* Chat container — only the messages scroll; header + input stay put */}
        <div className="flex-1 min-h-0 mb-[max(1rem,env(safe-area-inset-bottom))] rounded-2xl overflow-hidden flex flex-col bg-background border border-border shadow-xl">
          <MoonmindChat className="flex-1 min-h-0" />
        </div>
      </div>
    </div>
  );
};

export default MoonmindPage;

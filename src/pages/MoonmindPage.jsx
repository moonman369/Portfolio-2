import { useEffect, useRef } from "react";
import { Minimize2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { headerActionClass } from "../lib/moonmindUi";
import { switchView } from "../lib/moonmindView";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { useMoonmind } from "../context/MoonmindContext";
import { useTheme } from "../context/ThemeContext";
import { useOffscreenPause } from "../hooks/useOffscreenPause";
import { useVisualViewportVars } from "../hooks/useVisualViewportVars";
import {
  MOONMIND_SUBTITLE,
  MOONMIND_SUBTITLE_SHORT,
} from "../context/constants";
import StarBackground from "../components/StarBackground";
import LightModeBackground from "../components/LightModeBackground";
import MoonmindChat from "../components/MoonmindChat";
import MoonMark from "../components/MoonMark";
import MoonmindNewChat from "../components/MoonmindNewChat";

const MoonmindPage = () => {
  const { isDarkMode } = useTheme();
  const { open, refreshPending } = useMoonmind();
  const reducedMotion = usePrefersReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  // A hidden tab pauses every animation here too (the loader, the skeleton,
  // the background), as on the home page.
  useOffscreenPause();
  const pageRef = useRef(null);
  useVisualViewportVars(pageRef);

  // Return to wherever the chat was expanded from (preserving scroll/section).
  // A direct load or a reload of /moonmind carries no internal state and has
  // no entry of ours to go back to, so it falls through to home rather than
  // stepping out of the site. Either way the floating panel is open when the
  // page comes back, with the same conversation: that is what "minimize"
  // promises. Its open state lives in the Moonmind context, which outlives
  // the route, so it is set before navigating (a flag in the history state
  // would be lost with navigate(-1)). The page shrinks into the panel with a
  // view transition where supported.
  const minimize = () =>
    switchView(
      () => {
        open();
        if (location.state?.internal) navigate(-1);
        else navigate(location.state?.from || "/");
      },
      { reducedMotion },
    );

  // Escape minimizes, unless the new-chat confirmation is open (Escape
  // cancels that) or an IME composition is in progress.
  const minimizeRef = useRef(minimize);
  const pendingRef = useRef(refreshPending);
  useEffect(() => {
    minimizeRef.current = minimize;
    pendingRef.current = refreshPending;
  });
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape" || e.isComposing || e.keyCode === 229) return;
      if (e.defaultPrevented || pendingRef.current) return;
      minimizeRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    // Fixed to the visual viewport, so the composer stays above an on-screen
    // keyboard and the list shrinks instead (useVisualViewportVars).
    <div
      ref={pageRef}
      className="mm-page fixed inset-x-0 text-foreground flex flex-col overflow-hidden"
    >
      {/* Same background as the site */}
      {isDarkMode ? <StarBackground /> : <LightModeBackground />}

      {/* Phones: no box. The chat runs edge to edge under a compact
          header; from 640px it sits in its card as before. */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col w-full max-w-3xl mx-auto sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)]">
        {/* Header (fixed) */}
        <div className="paper-scrim flex items-center gap-3 py-4 max-sm:py-1.5 max-sm:gap-2.5 max-sm:pl-[max(1rem,env(safe-area-inset-left))] max-sm:pr-[max(0.375rem,env(safe-area-inset-right))] shrink-0 text-left">
          <span className="grid place-items-center size-8 sm:size-11 shrink-0 rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
            <MoonMark size={24} className="max-sm:size-[18px]" />
          </span>
          {/* The subtitle is never cut off: the full line where it fits,
              the short one in a narrow header (container query). */}
          <div className="@container flex-1 min-w-0">
            <h1 className="font-heading text-2xl max-sm:text-base font-semibold leading-tight text-foreground">
              Moonmind AI
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              <span className="@max-[12rem]:hidden">{MOONMIND_SUBTITLE}</span>
              <span className="@min-[12rem]:hidden">{MOONMIND_SUBTITLE_SHORT}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 max-sm:gap-0 shrink-0">
            <MoonmindNewChat />
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
        <div
          className={cn(
            "mm-view flex-1 min-h-0 overflow-hidden flex flex-col bg-background",
            "sm:mb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:border sm:border-border sm:shadow-xl",
            "max-sm:border-t max-sm:border-border max-sm:pl-[env(safe-area-inset-left)] max-sm:pr-[env(safe-area-inset-right)] max-sm:pb-[env(safe-area-inset-bottom)]",
          )}
        >
          <MoonmindChat className="flex-1 min-h-0" />
        </div>
      </div>
    </div>
  );
};

export default MoonmindPage;

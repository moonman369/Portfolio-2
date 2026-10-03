import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { waapi } from "animejs/waapi";
import { createSpring } from "animejs/easings/spring";
import { cn } from "../lib/utils";
import { DURATION, EASE, SPRING } from "../lib/motion";
import { headerActionClass } from "../lib/moonmindUi";
import { MoonmindChatLazy, moonmindIntentProps } from "../lib/lazyChat";
import { switchView } from "../lib/moonmindView";
import { inertOutside, trapTab } from "../lib/inertOutside";
import { useMoonmind } from "../context/MoonmindContext";
import { useVisualViewportVars } from "../hooks/useVisualViewportVars";
import {
  useMediaQuery,
  usePrefersReducedMotion,
} from "../hooks/usePrefersReducedMotion";
import { useMoonmindNudge } from "../hooks/useMoonmindNudge";
import {
  MOONMIND_SUBTITLE,
  MOONMIND_SUBTITLE_SHORT,
} from "../context/constants";
import GlowBeam from "./GlowBeam";
import MoonLoader from "./MoonLoader";
import MoonMark from "./MoonMark";
import MoonmindNewChat from "./MoonmindNewChat";
import MoonmindNudge from "./MoonmindNudge";

// The launcher's size: the panel grows out of it and shrinks back into it.
const LAUNCHER_PX = 56;

// Shown for the moment it takes to fetch the chat chunk the first time:
// the chat's one loader, at its first phase.
const ChatLoading = () => (
  <div role="status" className="flex-1 min-h-0 grid place-items-center">
    <MoonLoader pulse className="text-primary" />
    <span className="sr-only">Loading Moonmind</span>
  </div>
);

const Moonmind = () => {
  const { isOpen, open, close, refreshPending } = useMoonmind();
  // The intro pop-up by the entry point, on every load (see MoonmindNudge).
  useMoonmindNudge({ isOpen });
  const navigate = useNavigate();
  const location = useLocation();
  // Keeps the mobile panel (and its input) inside the visible area when the
  // on-screen keyboard opens.
  const panelRef = useRef(null);
  useVisualViewportVars(panelRef, isOpen);

  // Launcher -> panel morph (desktop, motion allowed). On close the panel
  // stays rendered, inert and hidden from assistive tech, only while it
  // shrinks back into the launcher. Phones keep the plain fade.
  const reducedMotion = usePrefersReducedMotion();
  const desktop = useMediaQuery("(min-width: 640px)");
  const canMorph = desktop && !reducedMotion;
  const [exiting, setExiting] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);
  // Already open when this mounts: the visitor is coming back from the full
  // page, and the view transition (or an instant switch) shows the panel.
  // No launcher morph and no fade for that, only for opens from here.
  const [quiet, setQuiet] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setExiting(!isOpen && canMorph);
    if (!isOpen) setQuiet(false);
  }
  const showPanel = isOpen || exiting;

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !canMorph || quiet || (!isOpen && !exiting)) return undefined;

    const { width, height } = panel.getBoundingClientRect();
    const collapsed = `scale(${LAUNCHER_PX / width}, ${LAUNCHER_PX / height})`;
    const content = panel.querySelectorAll("[data-morph-content]");

    const animations = isOpen
      ? [
          waapi.animate(panel, {
            transform: [collapsed, "scale(1, 1)"],
            ease: createSpring(SPRING),
          }),
          waapi.animate(panel, {
            opacity: [0.4, 1],
            duration: DURATION.fast,
            ease: EASE.out,
          }),
          waapi.animate(content, {
            opacity: [0, 1],
            duration: DURATION.base,
            delay: DURATION.fast,
            ease: EASE.out,
          }),
        ]
      : [
          waapi.animate(content, {
            opacity: [1, 0],
            duration: DURATION.fast,
            ease: EASE.out,
          }),
          waapi.animate(panel, {
            transform: ["scale(1, 1)", collapsed],
            opacity: [1, 0],
            duration: DURATION.base,
            ease: EASE.inOut,
            onComplete: () => setExiting(false),
          }),
        ];
    return () => animations.forEach((animation) => animation.cancel());
  }, [isOpen, exiting, canMorph, quiet]);

  // ---- Dialog behaviour ----
  // Under 640px the panel covers most of the screen, so it is modal: the page
  // behind is inert and does not scroll, Tab stays inside, a tap on the dim
  // backdrop closes it. From 640px it stays non-modal. At any size Escape
  // closes it and focus goes back to what opened it (else the launcher, or
  // the bottom-nav button). On touch screens nothing focuses the input (the
  // keyboard would cover the starters); focus lands on the dialog instead.
  const modal = !desktop;
  const launcherRef = useRef(null);
  const openerRef = useRef(null);
  const closeRef = useRef(close);
  const pendingRef = useRef(refreshPending);
  useEffect(() => {
    closeRef.current = close;
    pendingRef.current = refreshPending;
  });

  const returnFocus = () => {
    const target = [
      openerRef.current,
      launcherRef.current,
      document.querySelector("[data-moonmind-anchor=bar]"),
    ].find((el) => el?.isConnected && el.getClientRects().length > 0);
    target?.focus({ preventScroll: true });
  };

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    const active = document.activeElement;
    openerRef.current = active && active !== document.body ? active : null;
    if (window.matchMedia?.("(pointer: coarse)").matches) {
      panelRef.current?.focus({ preventScroll: true });
    }
    // A frame after closing, once the launcher is back (it renders only
    // while closed).
    return () => requestAnimationFrame(returnFocus);
  }, [isOpen]);


  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (event.isComposing || event.keyCode === 229) return;
      // The new-chat confirmation takes Escape for itself.
      if (pendingRef.current) return;
      closeRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !modal || !panel) return undefined;
    const restoreInert = inertOutside(panel);
    // Lock the page behind without a jump: keep the scrollbar's gutter.
    const root = document.documentElement;
    const previous = [root.style.overflow, root.style.scrollbarGutter];
    root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    const onKeyDown = (event) => trapTab(panel, event);
    panel.addEventListener("keydown", onKeyDown);
    return () => {
      restoreInert();
      [root.style.overflow, root.style.scrollbarGutter] = previous;
      panel.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, modal]);

  // The panel grows into the full page (a view transition where supported).
  const expand = () =>
    switchView(
      () =>
        navigate("/moonmind", {
          state: { from: `${location.pathname}${location.hash}`, internal: true },
        }),
      { reducedMotion },
    );

  return (
    <>
      {/* Floating bot button (desktop only) — shown when the chat is closed */}
      {!isOpen && (
        <button
          ref={launcherRef}
          onClick={open}
          {...moonmindIntentProps}
          aria-label="Open Moonmind chat"
          aria-expanded={isOpen}
          title="Moonmind AI"
          data-moonmind-anchor="launcher"
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
      {/* Right after the launcher, so keyboard users meet it in order. */}
      <MoonmindNudge anchor="launcher" />

      {/* Phones: the dim backdrop of the modal panel; a tap closes it. */}
      {isOpen && modal && (
        <div
          aria-hidden="true"
          data-modal-keep
          onClick={close}
          className={cn(
            "mm-scrim fixed inset-0 z-[59] bg-background/70",
            !quiet && "animate-fade-in",
          )}
        />
      )}

      {/* Chat panel */}
      {showPanel && (
        <div
          ref={panelRef}
          inert={!isOpen}
          aria-hidden={!isOpen || undefined}
          aria-modal={(isOpen && modal) || undefined}
          tabIndex={-1}
          className={cn(
            "mm-panel mm-view fixed z-[60] flex flex-col overflow-hidden rounded-2xl focus:outline-none",
            canMorph ? "origin-bottom-right" : !quiet && "animate-fade-in",
            "bg-background border border-border shadow-xl",
            "sm:inset-auto sm:right-[max(1.5rem,env(safe-area-inset-right))] sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
            "sm:w-96 sm:h-[600px] sm:max-h-[80vh]",
          )}
          role="dialog"
          aria-label="Moonmind AI assistant"
        >
          {/* Header */}
          <div
            data-morph-content
            className="flex items-center gap-3 pl-4 pr-1.5 py-1.5 border-b border-border bg-card"
          >
            <span className="grid place-items-center size-9 max-sm:size-8 shrink-0 rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
              <MoonMark size={20} className="max-sm:size-[18px]" />
            </span>
            {/* The subtitle is never cut off: the full line where it fits,
                the short one in a narrow header (container query). */}
            <div className="@container flex-1 min-w-0">
              <p className="font-heading font-semibold leading-tight">
                Moonmind AI
              </p>
              <p className="font-mono text-xs text-muted-foreground leading-tight">
                <span className="@max-[12rem]:hidden">{MOONMIND_SUBTITLE}</span>
                <span className="@min-[12rem]:hidden">{MOONMIND_SUBTITLE_SHORT}</span>
              </p>
            </div>

            <div className="flex items-center shrink-0">
              <MoonmindNewChat />
              <button
                onClick={expand}
                aria-label="Expand to full page"
                title="Expand"
                className={headerActionClass}
              >
                <Maximize2 size={17} aria-hidden="true" />
              </button>
              <button
                onClick={close}
                aria-label="Close Moonmind"
                title="Close"
                className={headerActionClass}
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div data-morph-content className="flex-1 min-h-0 flex flex-col">
            <Suspense fallback={<ChatLoading />}>
              <MoonmindChatLazy className="flex-1 min-h-0" />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
};

export default Moonmind;

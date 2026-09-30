import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { X } from "lucide-react";
import { waapi } from "animejs/waapi";
import { createSpring } from "animejs/easings/spring";
import { cn } from "../lib/utils";
import { DURATION, EASE, SPRING } from "../lib/motion";
import { hideNudge, nudgeStore } from "../lib/moonmindNudge";
import { preloadMoonmindChat } from "../lib/lazyChat";
import { useMoonmind } from "../context/MoonmindContext";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import {
  MOONMIND_NUDGE_CLOSE_LABEL,
  MOONMIND_NUDGE_STARTERS,
  MOONMIND_NUDGE_TEXT,
} from "../context/constants";

// The once-per-visit speech bubble by a Moonmind entry point (see
// lib/moonmindNudge.js for when). Rendered straight after its button so
// keyboard users meet it in order; a polite live region (role="status"),
// never a dialog, and it never takes focus. It sits 12px above the button
// (or, for the bottom-nav button, above the whole bar, so it never covers
// it), within 16px of the screen edges and the safe areas, with a tail
// pointing at the button.
//
// Goes away on its close button, Escape, a tap outside it, opening the chat,
// or by itself after ~9s (paused while the pointer or focus is inside it).
// Motion: it scales and fades out of its tail on a soft spring, and one ring
// pulses out from the button. Reduced motion: a fade only. Transform and
// opacity only; no blur.

const GAP_PX = 12;
const AUTO_HIDE_MS = 9000;
const TAIL_INSET_PX = 22; // keep the tail off the rounded corners

const NudgeBubble = ({ anchor, leaving, onGone }) => {
  const { open, sendMessage } = useMoonmind();
  const reducedMotion = usePrefersReducedMotion();
  const bubbleRef = useRef(null);
  const ringRef = useRef(null);
  const [place, setPlace] = useState(null);

  // Where: measured from the anchor (and its bar), again on resize.
  useLayoutEffect(() => {
    const measure = () => {
      const button = document.querySelector(`[data-moonmind-anchor="${anchor}"]`);
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const above = anchor === "bar" ? button.closest("nav") ?? button : button;
      const top = above.getBoundingClientRect().top;
      setPlace({
        bottom: window.innerHeight - top + GAP_PX,
        centreX: rect.left + rect.width / 2,
        ring: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [anchor]);

  // The tail points at the button: its x within the bubble, clamped clear of
  // the corners. Also the scale origin.
  const [tailX, setTailX] = useState(null);
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble || !place) return;
    const { left, width } = bubble.getBoundingClientRect();
    setTailX(
      Math.min(width - TAIL_INSET_PX, Math.max(TAIL_INSET_PX, place.centreX - left)),
    );
  }, [place]);

  // In: once the tail is placed.
  const placed = tailX !== null;
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble || !placed) return undefined;
    const animations = reducedMotion
      ? [waapi.animate(bubble, { opacity: [0, 1], duration: DURATION.base, ease: EASE.out })]
      : [
          waapi.animate(bubble, {
            transform: ["scale(0.6)", "scale(1)"],
            ease: createSpring(SPRING),
          }),
          waapi.animate(bubble, { opacity: [0, 1], duration: DURATION.fast, ease: EASE.out }),
          waapi.animate(ringRef.current, {
            transform: ["scale(1)", "scale(1.9)"],
            opacity: [0.7, 0],
            duration: DURATION.slow * 1.5,
            ease: EASE.out,
          }),
        ];
    return () => animations.forEach((animation) => animation.cancel());
  }, [placed, reducedMotion]);

  // Out: a quick fade, then unmount.
  useLayoutEffect(() => {
    if (!leaving) return undefined;
    const bubble = bubbleRef.current;
    if (!bubble) {
      onGone();
      return undefined;
    }
    const animation = waapi.animate(bubble, {
      opacity: [Number(getComputedStyle(bubble).opacity) || 1, 0],
      duration: DURATION.fast,
      ease: EASE.out,
      onComplete: onGone,
    });
    return () => animation.cancel();
  }, [leaving, onGone]);

  // Escape (only while shown), a tap outside, and the ~9s timer (paused
  // while the pointer or focus is inside).
  const holdRef = useRef({ pointer: false, focus: false });
  useLayoutEffect(() => {
    if (leaving) return undefined;
    let timer = setTimeout(hideNudge, AUTO_HIDE_MS);
    const restart = () => {
      clearTimeout(timer);
      const { pointer, focus } = holdRef.current;
      if (!pointer && !focus) timer = setTimeout(hideNudge, AUTO_HIDE_MS);
    };
    holdRef.current.restart = restart;
    const onKeyDown = (event) => {
      if (event.key === "Escape") hideNudge();
    };
    const onPointerDown = (event) => {
      if (!bubbleRef.current?.contains(event.target)) hideNudge();
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [leaving]);
  const hold = (key, value) => {
    holdRef.current[key] = value;
    holdRef.current.restart?.();
  };

  const ask = (question) => {
    hideNudge();
    open();
    sendMessage(question);
  };

  if (!place) return null;

  return (
    <>
      {!reducedMotion && (
        <span
          ref={ringRef}
          aria-hidden="true"
          className="mm-nudge-ring pointer-events-none fixed z-[54] rounded-full opacity-0"
          style={place.ring}
        />
      )}
      <div
        className={cn(
          "pointer-events-none fixed z-[55] flex",
          anchor === "bar" ? "justify-center" : "justify-end",
          anchor === "bar"
            ? "left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))]"
            : "left-[max(1rem,env(safe-area-inset-left))] right-[max(1.5rem,env(safe-area-inset-right))]",
        )}
        style={{ bottom: place.bottom }}
      >
        <div
          ref={bubbleRef}
          onPointerEnter={() => hold("pointer", true)}
          onPointerLeave={() => hold("pointer", false)}
          onFocus={() => hold("focus", true)}
          onBlur={() => hold("focus", false)}
          className="mm-nudge pointer-events-auto relative w-full max-w-[20rem] rounded-2xl bg-card p-3 pr-12 text-left shadow-xl ring-1 ring-inset ring-primary/35"
          style={{
            opacity: 0,
            transformOrigin: tailX === null ? "50% 100%" : `${tailX}px 100%`,
          }}
        >
          <p className="text-sm leading-snug text-foreground">{MOONMIND_NUDGE_TEXT}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOONMIND_NUDGE_STARTERS.map((question) => (
              <button
                key={question}
                type="button"
                onPointerEnter={preloadMoonmindChat}
                onFocus={preloadMoonmindChat}
                onClick={() => ask(question)}
                className="min-h-11 rounded-full bg-primary/8 px-3.5 text-left text-sm text-foreground ring-1 ring-inset ring-primary/35 hover:bg-primary/15"
              >
                {question}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={hideNudge}
            aria-label={MOONMIND_NUDGE_CLOSE_LABEL}
            className="icon-btn absolute right-0.5 top-0.5 text-muted-foreground hover:text-foreground"
          >
            <X size={16} aria-hidden="true" />
          </button>
          {/* Tail, pointing down at the button. */}
          <span
            aria-hidden="true"
            className="mm-nudge-tail absolute -bottom-[7px] size-3.5 -translate-x-1/2 rotate-45 border-b border-r border-primary/35 bg-card"
            style={{ left: tailX ?? "50%" }}
          />
        </div>
      </div>
    </>
  );
};

const MoonmindNudge = ({ anchor }) => {
  const { anchor: current } = useSyncExternalStore(nudgeStore.subscribe, nudgeStore.get);
  const active = current === anchor;
  // Stays mounted through its fade-out.
  const [mounted, setMounted] = useState(active);
  if (active && !mounted) setMounted(true);
  const onGone = useCallback(() => setMounted(false), []);

  return (
    // The live region is always present (empty and out of flow when idle),
    // so the bubble's text is announced when it appears.
    <div role="status" aria-live="polite" className="fixed">
      {mounted && (
        <NudgeBubble anchor={anchor} leaving={!active} onGone={onGone} />
      )}
    </div>
  );
};

export default MoonmindNudge;

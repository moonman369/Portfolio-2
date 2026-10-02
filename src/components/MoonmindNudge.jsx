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
import { stagger } from "animejs/utils";
import { cn } from "../lib/utils";
import { DURATION, EASE, SPRING } from "../lib/motion";
import { hideNudge, nudgeStore } from "../lib/moonmindNudge";
import { preloadMoonmindChat } from "../lib/lazyChat";
import { useMoonmind } from "../context/MoonmindContext";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import {
  MOONMIND_INTRO_MS,
  MOONMIND_INTRO_TAG,
  MOONMIND_INTRO_TEXT,
  MOONMIND_INTRO_TITLE,
  MOONMIND_NUDGE_CLOSE_LABEL,
} from "../context/constants";
import MoonMark from "./MoonMark";

// The Moonmind intro: a small card that pops out of the Moonmind button on
// every page load (see hooks/useMoonmindNudge.js for when) and says what
// Moonmind is. Rendered straight after its button so keyboard users meet it
// in order; a polite live region (role="status"), never a dialog, and it
// never takes focus. It sits 12px above the button (or, for the bottom-nav
// button, above the whole bar, so it never covers it), within 16px of the
// screen edges and the safe areas, with a tail pointing at the button. The
// card itself is a button: it opens the chat (nothing is sent).
//
// It goes by itself after MOONMIND_INTRO_MS (a thin line along its foot
// drains over that time; hovering or focusing it pauses the countdown), or
// on its close button, Escape, a tap outside it, or opening the chat.
//
// It never covers the hero: if, where it would sit, it overlaps any of the
// hero's text, buttons or social icons on screen (the children of
// elements marked `data-nudge-avoid`; on a phone it sits above the bottom
// nav, over the end of the hero), it is skipped for this load. It stays hidden (visibility,
// so it is not announced either) until that check has passed.
//
// Motion (anime.js, on WAAPI so it runs on the compositor): the card springs
// out of its tail, its mark turns in and its lines rise one after another,
// one soft sheen crosses it, and a ring pulses out from the button; going
// away, it shrinks back into the tail. Reduced motion: a fade, and a plain
// timer. Transform and opacity only; no blur.

const GAP_PX = 12;
const TAIL_INSET_PX = 22; // keep the tail off the rounded corners

// Would the card cover any part of the hero's text, buttons or icons that
// is on screen?
const coversAvoided = (rect) =>
  [...document.querySelectorAll("[data-nudge-avoid] > *")].some((el) => {
    const r = el.getBoundingClientRect();
    return (
      r.width > 0 &&
      r.left < rect.right &&
      rect.left < r.right &&
      r.top < rect.bottom &&
      rect.top < r.bottom
    );
  });

const NudgeBubble = ({ anchor, leaving, onGone }) => {
  const { open } = useMoonmind();
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

  // The tail points at the button: its x within the card, clamped clear of
  // the corners. Also the scale origin. First, the card must not cover the
  // hero's calls to action; if it would, it goes without being shown.
  const [tailX, setTailX] = useState(null);
  const checkedRef = useRef(false);
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble || !place) return;
    const rect = bubble.getBoundingClientRect();
    if (!checkedRef.current) {
      checkedRef.current = true;
      if (coversAvoided(rect)) {
        hideNudge();
        return;
      }
    }
    const { left, width } = rect;
    setTailX(
      Math.min(width - TAIL_INSET_PX, Math.max(TAIL_INSET_PX, place.centreX - left)),
    );
  }, [place]);

  // In, and the countdown. The countdown line's own animation ends the card
  // (so pausing it pauses the countdown); reduced motion uses a timer.
  const placed = tailX !== null;
  const countdownRef = useRef(null);
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble || !placed) return undefined;
    const q = (selector) => bubble.querySelectorAll(selector);
    if (reducedMotion) {
      const fade = waapi.animate(bubble, { opacity: [0, 1], duration: DURATION.base, ease: EASE.out });
      countdownRef.current = { timer: setTimeout(hideNudge, MOONMIND_INTRO_MS) };
      return () => {
        fade.cancel();
        clearTimeout(countdownRef.current?.timer);
      };
    }
    const countdown = waapi.animate(q("[data-countdown]"), {
      transform: ["scaleX(1)", "scaleX(0)"],
      duration: MOONMIND_INTRO_MS,
      ease: "linear",
      onComplete: hideNudge,
    });
    countdownRef.current = { animation: countdown };
    const animations = [
      countdown,
      waapi.animate(bubble, {
        transform: ["translateY(10px) scale(0.5)", "translateY(0) scale(1)"],
        ease: createSpring(SPRING),
      }),
      waapi.animate(bubble, { opacity: [0, 1], duration: DURATION.fast, ease: EASE.out }),
      // Mark, title, tag and text rise in one after another.
      waapi.animate(q("[data-intro]"), {
        transform: ["translateY(8px)", "translateY(0)"],
        opacity: [0, 1],
        duration: DURATION.base,
        delay: stagger(70, { start: 150 }),
        ease: EASE.out,
      }),
      waapi.animate(q("[data-intro-mark]"), {
        transform: ["rotate(-120deg) scale(0.6)", "rotate(0deg) scale(1)"],
        delay: 150,
        ease: createSpring({ bounce: 0.35, duration: 700 }),
      }),
      // One soft sheen across the card once it has landed.
      waapi.animate(q("[data-sheen]"), {
        transform: ["translateX(-100%)", "translateX(260%)"],
        opacity: [0, 1, 0],
        duration: 1100,
        delay: 480,
        ease: EASE.inOut,
      }),
      waapi.animate(ringRef.current, {
        transform: ["scale(1)", "scale(1.9)"],
        opacity: [0.7, 0],
        duration: DURATION.slow * 1.5,
        ease: EASE.out,
      }),
    ];
    return () => animations.forEach((animation) => animation.cancel());
  }, [placed, reducedMotion]);

  // Out: shrink back into the tail, then unmount.
  useLayoutEffect(() => {
    if (!leaving) return undefined;
    const bubble = bubbleRef.current;
    if (!bubble) {
      onGone();
      return undefined;
    }
    const animation = waapi.animate(bubble, {
      opacity: [Number(getComputedStyle(bubble).opacity) || 1, 0],
      ...(reducedMotion ? {} : { transform: ["scale(1)", "scale(0.85)"] }),
      duration: DURATION.fast,
      ease: "in(2)",
      onComplete: onGone,
    });
    return () => animation.cancel();
  }, [leaving, onGone, reducedMotion]);

  // Escape (only while shown) and a tap outside.
  useLayoutEffect(() => {
    if (leaving) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") hideNudge();
    };
    const onPointerDown = (event) => {
      if (!bubbleRef.current?.contains(event.target)) hideNudge();
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [leaving]);

  // Hovering or focusing the card pauses the countdown; leaving resumes it.
  const holdRef = useRef({ pointer: false, focus: false });
  const hold = (key, value) => {
    holdRef.current[key] = value;
    const held = holdRef.current.pointer || holdRef.current.focus;
    const countdown = countdownRef.current;
    if (!countdown || leaving) return;
    if (countdown.animation) {
      if (held) countdown.animation.pause();
      else countdown.animation.resume();
    } else {
      clearTimeout(countdown.timer);
      if (!held) countdown.timer = setTimeout(hideNudge, MOONMIND_INTRO_MS);
    }
  };

  const openChat = () => {
    hideNudge();
    open();
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
          className="mm-nudge pointer-events-auto relative w-full max-w-[20rem] rounded-2xl bg-card text-left shadow-xl ring-1 ring-inset ring-primary/35"
          style={{
            opacity: 0,
            visibility: tailX === null ? "hidden" : undefined,
            transformOrigin: tailX === null ? "50% 100%" : `${tailX}px 100%`,
          }}
        >
          {/* Clips the sheen and the countdown line to the rounded card. */}
          <div className="relative overflow-hidden rounded-2xl">
            <span aria-hidden="true" data-sheen className="mm-nudge-sheen" />
            <button
              type="button"
              onClick={openChat}
              onPointerEnter={preloadMoonmindChat}
              onFocus={preloadMoonmindChat}
              className="mm-nudge-ask flex w-full items-start gap-3 rounded-2xl p-3.5 pr-12 text-left"
            >
              <span
                data-intro
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/30"
              >
                <span data-intro-mark className="grid place-items-center">
                  <MoonMark size={20} />
                </span>
              </span>
              <span className="min-w-0">
                <span data-intro className="block font-heading text-[0.95rem] font-semibold leading-tight text-foreground">
                  {MOONMIND_INTRO_TITLE}
                </span>
                <span data-intro className="mt-0.5 block font-mono text-[11px] leading-tight text-muted-foreground">
                  {MOONMIND_INTRO_TAG}
                </span>
                <span data-intro className="mt-2 block text-sm leading-snug text-foreground">
                  {MOONMIND_INTRO_TEXT}
                </span>
              </span>
            </button>
            {/* Drains over the card's lifetime. */}
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/12">
              <span data-countdown className="mm-nudge-countdown block h-full w-full origin-left" />
            </span>
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
  // Stays mounted through its exit.
  const [mounted, setMounted] = useState(active);
  if (active && !mounted) setMounted(true);
  const onGone = useCallback(() => setMounted(false), []);

  return (
    // The live region is always present (empty and out of flow when idle),
    // so the card's text is announced when it appears.
    <div role="status" aria-live="polite" className="fixed">
      {mounted && (
        <NudgeBubble anchor={anchor} leaving={!active} onGone={onGone} />
      )}
    </div>
  );
};

export default MoonmindNudge;

import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "animejs/animation";
import { createSpring } from "animejs/easings/spring";
import { cn } from "../lib/utils";
import { SATELLITE_REST, satellitePoint } from "../lib/heroMoonGeometry";
import { createMoonSphereHost } from "../lib/moonSphereHost";
import { getMoonTexture } from "../lib/moonTextureSource";
import { isIdle, subscribeIdle } from "../lib/idleFreeze";
import {
  fillCaption,
  illuminatedFraction,
  lunarCycle,
  phaseIndex,
} from "../lib/lunarPhase";
import {
  MOON_BACK_TO_TODAY,
  MOON_CAPTION_TODAY,
  MOON_CAPTION_TODAY_SHORT,
  MOON_CAPTION_VIEWING,
  MOON_CAPTION_VIEWING_SHORT,
  MOON_DRAG_HINT,
  MOON_PHASE_NAMES,
} from "../context/constants";
import {
  useFinePointer,
  usePrefersReducedMotion,
} from "../hooks/usePrefersReducedMotion";
import HeroMoon3D from "./HeroMoon3D";

// The hero moon, made playable. It opens on today's real phase (computed from
// the date, lib/lunarPhase.js) and is a slider over one lunar cycle:
// 0 = new, 25 = first quarter, 50 = full, 75 = last quarter, 100 = new again.
//
//   drag left/right   the shadow follows the pointer (the terminator always
//                     moves the way the pointer goes) and the sphere turns a
//                     little with it; release springs to the nearest of the
//                     eight named phases
//   tap or click      step to the next named phase; the satellite runs a lap
//   arrow keys        previous/next; Home/End jump to either end (new moon)
//   back to today     appears once the moon is away from today's phase and
//                     eases it back
//   hover (desktop)   the orbit brightens; the sphere itself stays put
//
// The caption underneath says what is shown: today's phase and how much is
// lit, or the phase being viewed. The hero moon does not follow scroll (the
// navbar's mark does). The moon is a lit sphere on a canvas
// (lib/moonSphere.js), drawn in a worker where the browser allows it
// (lib/moonSphereHost.js), so its frames never cost the main thread: frames
// are drawn only when something changes; on desktop it also turns very
// slowly while the hero is on screen, the tab is visible and there has been
// input in the last 30s (lib/idleFreeze.js). Phones and reduced motion: one
// frame per phase change, no idle turn. Live values are in refs; React re-renders only when the caption's
// phase name or the "away from today" state changes.

const STOPS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const DRAG_THRESHOLD_PX = 6;
// Cycle travelled per slider width of drag: half a cycle (new → full) takes
// about the width of the disc, so the terminator keeps up with the pointer.
const DRAG_CYCLE_PER_WIDTH = 1 / 1.4;
const DRAG_TURN = 0.22; // radians of turn for a full-width drag
const SNAP_SPRING = { bounce: 0.25, duration: 520 };
const LAP_MS = 1600;
// Closer than this to today (in cycle, ~3.5 hours) counts as today.
const TODAY_EPSILON = 0.005;
// Canvas resolution cap: frames must stay well under 4ms on a desktop
// (measured: ~2.4ms when the sphere turns, ~1.3ms for a phase change). The
// disc shows at up to ~340 CSS px, a mild upscale of a photographic texture.
const MAX_CANVAS_PX = 256;

// The drag hint goes after the first interaction and stays gone for the
// rest of the visit (memory only).
let hintDismissed = false;

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const cycleGap = (a, b) => {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
};
const phaseName = (cycle) => MOON_PHASE_NAMES[phaseIndex(cycle)];
const nearestStop = (phase) =>
  STOPS.reduce((best, stop) =>
    Math.abs(stop - phase) < Math.abs(best - phase) ? stop : best,
  );

const HeroMoonControl = ({ className }) => {
  const sliderRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const [today] = useState(() => lunarCycle());
  const [hintVisible, setHintVisible] = useState(!hintDismissed);
  // What the caption shows: which named phase, and whether it is today's.
  const [view, setView] = useState({ index: phaseIndex(today), away: false });
  const live = useRef({ phase: today, view, texture: null });
  // Set by the effect; the "back to today" button calls it.
  const backToTodayRef = useRef(() => {});

  const moon = useMemo(() => <HeroMoon3D className="w-full" />, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return undefined;
    const s = live.current;
    const q = (selector) => slider.querySelector(selector);
    const disc = q("[data-moon-disc]");
    const canvas = q("canvas");
    const animated = finePointer && !reducedMotion; // idle turn
    let frame = 0;
    let pendingPhase = null;
    let visible = true;
    let tabVisible = document.visibilityState === "visible";
    let awake = !isIdle(); // false after 30s without input (idleFreeze)
    let spring = null;
    let lap = null;
    let drag = null;
    let sphere = null; // lib/moonSphereHost.js: in a worker where possible
    let spherePx = 0;
    let disposed = false;

    // ---- The sphere ----
    const buildSphere = () => {
      const width = disc.getBoundingClientRect().width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.max(64, Math.min(MAX_CANVAS_PX, Math.round(width * dpr)));
      if (sphere && spherePx === px) return;
      if (!sphere) {
        // The flat placeholder goes once the first frame is on the canvas.
        sphere = createMoonSphereHost(canvas, {
          onDrawn: () => disc.setAttribute("data-ready", ""),
        });
        canvas.__moon = sphere; // for measurement in tests
        if (s.texture) sphere.setTexture(s.texture);
        sphere.setPhase(s.phase);
      }
      spherePx = px;
      sphere.resize(px);
      updateIdle();
    };
    const updateIdle = () =>
      sphere?.setIdle(animated && visible && tabVisible && awake);

    // ---- Painting ----
    const paint = (phase) => {
      sphere?.setPhase(phase);
      slider.setAttribute("aria-valuenow", String(Math.round(phase * 100)));
      slider.setAttribute("aria-valuetext", phaseName(phase));
      const index = phaseIndex(phase);
      const away = cycleGap(phase, today) > TODAY_EPSILON;
      if (index !== s.view.index || away !== s.view.away) {
        s.view = { index, away };
        setView(s.view);
      }
    };
    const flush = () => {
      frame = 0;
      if (pendingPhase !== null) {
        s.phase = pendingPhase;
        paint(pendingPhase);
        pendingPhase = null;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const placeSatellite = (theta) => {
      const { x, y, front } = satellitePoint(theta);
      const near = q("[data-sat-front]");
      const far = q("[data-sat-back]");
      for (const el of [near, far]) {
        el?.setAttribute("cx", x.toFixed(2));
        el?.setAttribute("cy", y.toFixed(2));
      }
      // Inline style, so it wins over the entrance's committed opacity.
      if (near) near.style.opacity = front ? "1" : "0";
      if (far) far.style.opacity = front ? "0" : "1";
    };

    // ---- Motion ----
    const springTo = (target, onDone) => {
      spring?.cancel();
      spring = null;
      if (reducedMotion) {
        s.phase = target;
        paint(target);
        onDone?.();
        return;
      }
      const state = { phase: s.phase };
      spring = animate(state, {
        phase: target,
        ease: createSpring(SNAP_SPRING),
        onUpdate: () => {
          s.phase = state.phase;
          paint(state.phase);
        },
        onComplete: () => {
          spring = null;
          onDone?.();
        },
      });
    };

    const runLap = () => {
      if (reducedMotion) return;
      lap?.cancel();
      const state = { theta: SATELLITE_REST };
      lap = animate(state, {
        theta: SATELLITE_REST + Math.PI * 2,
        duration: LAP_MS,
        ease: "out(4)", // quick, then settling
        onUpdate: () => placeSatellite(state.theta),
        onComplete: () => placeSatellite(SATELLITE_REST),
      });
    };

    // The first interaction retires the drag hint for the visit.
    const interacted = () => {
      if (hintDismissed) return;
      hintDismissed = true;
      setHintVisible(false);
    };

    backToTodayRef.current = () => {
      interacted();
      springTo(today);
    };

    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            updateIdle();
          })
        : null;
    observer?.observe(slider);

    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      updateIdle();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const unsubscribeIdle = subscribeIdle((idle) => {
      awake = !idle;
      updateIdle();
    });

    // Resize: rebuild only when the canvas resolution would change.
    const resizer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => buildSphere())
        : null;
    // The sphere is built in a task of its own just after the first paint
    // (its geometry is ~10ms, ~50ms on a throttled phone), not inside React's
    // first commit, so it never lengthens the page's longest startup task.
    // Until then the disc is a flat circle in CSS.
    let buildTimer = 0;
    const buildFrame = requestAnimationFrame(() => {
      buildTimer = setTimeout(() => {
        if (disposed) return;
        buildSphere();
        resizer?.observe(disc);
      }, 0);
    });

    // The texture (shared with the site mark) arrives after the page has
    // loaded; until then the sphere is lit but plain.
    getMoonTexture()
      .then((texture) => {
        s.texture = texture;
        if (!disposed) sphere?.setTexture(texture);
      })
      .catch(() => {
        /* keep the plain sphere */
      });

    // ---- Pointer ----
    // Nothing happens until the drag actually moves or a tap completes: a
    // vertical scroll that happens to start on the moon changes nothing.
    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      drag = {
        id: event.pointerId,
        x: event.clientX,
        start: s.phase,
        moved: false,
        width: slider.getBoundingClientRect().width,
      };
      slider.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      if (!drag.moved) {
        interacted();
        spring?.cancel();
        spring = null;
        drag.start = s.phase;
        drag.x = event.clientX;
      }
      drag.moved = true;
      const move = (event.clientX - drag.x) / drag.width;
      // Along the cycle the terminator always travels right-to-left, so
      // dragging right goes back in the cycle and the shadow follows.
      pendingPhase = clamp01(drag.start - move * DRAG_CYCLE_PER_WIDTH);
      if (!reducedMotion) {
        // Negative longitude carries the surface to the right.
        const turn = -move * DRAG_TURN * 2;
        sphere?.setTarget(Math.max(-DRAG_TURN, Math.min(DRAG_TURN, turn)), 0);
      }
      schedule();
    };

    const endDrag = (event, cancelled) => {
      if (!drag || event.pointerId !== drag.id) return;
      const { moved } = drag;
      drag = null;
      if (!moved && cancelled) return; // the browser took it for a scroll
      if (pendingPhase !== null) flush();
      if (moved) {
        sphere?.setTarget(0, 0);
        springTo(nearestStop(s.phase));
        return;
      }
      // A tap: step to the next named phase, and send the satellite round.
      // Past the end of the cycle it carries on from new moon.
      interacted();
      if (s.phase > 1 - 0.01) {
        s.phase = 0;
        paint(0);
      }
      springTo(STOPS.find((stop) => stop > s.phase + 0.01) ?? STOPS[1]);
      runLap();
    };
    const onPointerUp = (event) => endDrag(event, false);
    const onPointerCancel = (event) => endDrag(event, true);

    // ---- Keyboard ----
    const onKeyDown = (event) => {
      let target = null;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        target = STOPS.find((stop) => stop > s.phase + 0.01) ?? 1;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        target = [...STOPS].reverse().find((stop) => stop < s.phase - 0.01) ?? 0;
      } else if (event.key === "Home") {
        target = 0;
      } else if (event.key === "End") {
        target = 1;
      }
      if (target === null) return;
      event.preventDefault();
      interacted();
      springTo(target);
    };

    slider.addEventListener("pointerdown", onPointerDown);
    slider.addEventListener("pointermove", onPointerMove);
    slider.addEventListener("pointerup", onPointerUp);
    slider.addEventListener("pointercancel", onPointerCancel);
    slider.addEventListener("keydown", onKeyDown);

    return () => {
      disposed = true;
      backToTodayRef.current = () => {};
      cancelAnimationFrame(frame);
      cancelAnimationFrame(buildFrame);
      clearTimeout(buildTimer);
      spring?.cancel();
      lap?.cancel();
      sphere?.destroy();
      observer?.disconnect();
      resizer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribeIdle();
      slider.removeEventListener("pointerdown", onPointerDown);
      slider.removeEventListener("pointermove", onPointerMove);
      slider.removeEventListener("pointerup", onPointerUp);
      slider.removeEventListener("pointercancel", onPointerCancel);
      slider.removeEventListener("keydown", onKeyDown);
    };
  }, [reducedMotion, finePointer, today]);

  // Under 400px wide the caption is the short variant, on one line.
  const captionValues = view.away
    ? { phase: MOON_PHASE_NAMES[view.index] }
    : {
        phase: phaseName(today),
        lit: Math.round(illuminatedFraction(today) * 100),
      };
  const caption = fillCaption(
    view.away ? MOON_CAPTION_VIEWING : MOON_CAPTION_TODAY,
    captionValues,
  );
  const captionShort = fillCaption(
    view.away ? MOON_CAPTION_VIEWING_SHORT : MOON_CAPTION_TODAY_SHORT,
    captionValues,
  );

  const backToToday = () => {
    backToTodayRef.current();
    // The button goes away once the moon is back; keep focus on the moon.
    sliderRef.current?.focus();
  };

  return (
    <div className={cn("moon-control relative", className)}>
      <div
        ref={sliderRef}
        role="slider"
        tabIndex={0}
        aria-label="Moon phase"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(today * 100)}
        aria-valuetext={phaseName(today)}
        className="moon-slider pointer-events-auto touch-pan-y select-none rounded-full"
      >
        {moon}
      </div>
      {/* Centred directly under the disc, below the lower tick. Phones: at
          least as wide as the moon plus 0.75rem a side and pinned to that
          right edge, so the text stays centred under the disc while it fits
          and grows to the left (never off the screen) when it is longer;
          12px, one line. */}
      <div className="moon-caption pointer-events-none absolute max-sm:-right-3 max-sm:min-w-[calc(100%+1.5rem)] sm:left-1/2 top-[88%] sm:-translate-x-1/2 flex w-max flex-col items-center text-center font-mono text-xs sm:text-[11px] leading-snug tracking-wide text-muted-foreground">
        <p className="whitespace-nowrap sm:whitespace-normal sm:text-balance">
          <span className="min-[400px]:hidden">{captionShort}</span>
          <span className="max-[400px]:hidden">{caption}</span>
        </p>
        {view.away ? (
          <button
            type="button"
            onClick={backToToday}
            className="moon-today pointer-events-auto mt-0.5 inline-flex min-h-11 items-center rounded-full px-3 text-ink underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            {MOON_BACK_TO_TODAY}
          </button>
        ) : (
          <p
            aria-hidden="true"
            data-hidden={hintVisible ? undefined : ""}
            className="moon-hint mt-0.5"
          >
            {MOON_DRAG_HINT}
          </p>
        )}
      </div>
    </div>
  );
};

export default HeroMoonControl;

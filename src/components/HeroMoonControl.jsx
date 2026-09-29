import { useEffect, useRef, useState } from "react";
import { animate } from "animejs/animation";
import { createSpring } from "animejs/easings/spring";
import { cn } from "../lib/utils";
import { shadowPath, terminatorPath } from "../lib/moonPhase";
import {
  CX,
  CY,
  R,
  REST_PHASE,
  SATELLITE_REST,
  satellitePoint,
} from "../lib/heroMoonGeometry";
import { getScrollPhase, subscribeScrollPhase } from "../lib/scrollPhase";
import {
  useFinePointer,
  usePrefersReducedMotion,
} from "../hooks/usePrefersReducedMotion";
import HeroMoon from "./HeroMoon";

// The hero moon, made playable. It is a slider (0 = new, 100 = full):
//
//   drag left/right   move the terminator; release springs to the nearest of
//                     new / crescent / first quarter / gibbous / full
//   tap or click      step to the next of those; the satellite runs a lap
//   arrow keys        previous/next; Home/End jump to new/full
//   hover (desktop)   tilts toward the pointer, craters and orbit brighten
//
// Left alone it follows scroll progress, waxing from its resting gibbous to
// full by the Contact section (the navbar moon keeps the whole new → full
// range). After a visitor sets it, the next scroll eases it back to following.
// Every live value is in a ref and painted straight onto the SVG, so moving
// the pointer never re-renders React. Reduced motion: instant changes, no
// springs, tilt or lap.

const STOPS = [0, 0.25, 0.5, 0.75, 1];
const DRAG_THRESHOLD_PX = 6;
const TILT_DEG = 7;
const SNAP_SPRING = { bounce: 0.25, duration: 520 };
const LAP_MS = 1600;
// Ignore scrolls this soon after an interaction (touch drags can nudge it).
const SCROLL_GRACE_MS = 400;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const phaseName = (phase) => {
  if (phase < 0.03) return "new moon";
  if (phase > 0.97) return "full moon";
  if (Math.abs(phase - 0.5) < 0.03) return "first quarter";
  return phase < 0.5 ? "waxing crescent" : "waxing gibbous";
};

const nearestStop = (phase) =>
  STOPS.reduce((best, stop) =>
    Math.abs(stop - phase) < Math.abs(best - phase) ? stop : best,
  );

// While following scroll: from the resting gibbous to full.
const followPhase = (progress) => REST_PHASE + (1 - REST_PHASE) * progress;

const HeroMoonControl = ({ className }) => {
  const sliderRef = useRef(null);
  const tiltRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const [hintVisible, setHintVisible] = useState(true);
  const live = useRef({ phase: REST_PHASE, mode: "follow" });

  useEffect(() => {
    const slider = sliderRef.current;
    const tilt = tiltRef.current;
    if (!slider || !tilt) return undefined;
    const s = live.current;
    const q = (selector) => slider.querySelector(selector);
    let frame = 0;
    let pendingPhase = null;
    let pendingTilt = null;
    let visible = true;
    let spring = null;
    let lap = null;
    let drag = null;
    let lastInteraction = 0;

    // ---- Painting ----
    const paint = (phase) => {
      q("[data-terminator]")?.setAttribute("d", terminatorPath(phase, CX, CY, R));
      q("[data-shadow]")?.setAttribute("d", shadowPath(phase, CX, CY, R));
      slider.setAttribute("aria-valuenow", String(Math.round(phase * 100)));
      slider.setAttribute("aria-valuetext", phaseName(phase));
    };
    const flush = () => {
      frame = 0;
      if (pendingPhase !== null) {
        s.phase = pendingPhase;
        paint(pendingPhase);
        pendingPhase = null;
      }
      if (pendingTilt !== null) {
        tilt.style.transform = pendingTilt;
        pendingTilt = null;
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

    // ---- Visitor vs scroll ----
    const onScroll = () => {
      if (drag || !visible) return;
      if (performance.now() - lastInteraction < SCROLL_GRACE_MS) return;
      window.removeEventListener("scroll", onScroll);
      s.mode = "returning";
      springTo(followPhase(getScrollPhase()), () => {
        s.mode = "follow";
      });
    };
    const takeOver = () => {
      lastInteraction = performance.now();
      setHintVisible(false);
      if (s.mode !== "visitor") {
        s.mode = "visitor";
        window.addEventListener("scroll", onScroll, { passive: true });
      }
    };

    const unsubscribe = subscribeScrollPhase((progress) => {
      if (!visible || s.mode !== "follow" || spring) return;
      pendingPhase = followPhase(progress);
      schedule();
    });

    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
          })
        : null;
    observer?.observe(slider);

    // ---- Pointer ----
    // Nothing is taken over until the drag actually moves or a tap completes:
    // a vertical scroll that happens to start on the moon changes nothing.
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
      if (drag && event.pointerId === drag.id) {
        const dx = event.clientX - drag.x;
        if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
        if (!drag.moved) {
          takeOver();
          spring?.cancel();
          spring = null;
          drag.start = s.phase;
          drag.x = event.clientX;
        }
        drag.moved = true;
        lastInteraction = performance.now();
        pendingPhase = clamp01(drag.start + dx / (drag.width * 0.9));
        schedule();
        return;
      }
      if (reducedMotion || !finePointer || event.pointerType !== "mouse") return;
      const rect = slider.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      pendingTilt = `perspective(900px) rotateX(${(-ny * TILT_DEG).toFixed(2)}deg) rotateY(${(nx * TILT_DEG).toFixed(2)}deg)`;
      schedule();
    };

    const endDrag = (event, cancelled) => {
      if (!drag || event.pointerId !== drag.id) return;
      const { moved } = drag;
      drag = null;
      if (!moved && cancelled) return; // the browser took it for a scroll
      lastInteraction = performance.now();
      if (pendingPhase !== null) flush();
      if (!moved) {
        // A tap: step to the next phase, and send the satellite round.
        takeOver();
        const next = STOPS.find((stop) => stop > s.phase + 0.01) ?? STOPS[0];
        springTo(next);
        runLap();
      } else {
        springTo(nearestStop(s.phase));
      }
    };
    const onPointerUp = (event) => endDrag(event, false);
    const onPointerCancel = (event) => endDrag(event, true);

    const onPointerLeave = () => {
      if (drag) return;
      pendingTilt = "";
      schedule();
    };

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
      takeOver();
      springTo(target);
    };

    slider.addEventListener("pointerdown", onPointerDown);
    slider.addEventListener("pointermove", onPointerMove);
    slider.addEventListener("pointerup", onPointerUp);
    slider.addEventListener("pointercancel", onPointerCancel);
    slider.addEventListener("pointerleave", onPointerLeave);
    slider.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      spring?.cancel();
      lap?.cancel();
      unsubscribe();
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      slider.removeEventListener("pointerdown", onPointerDown);
      slider.removeEventListener("pointermove", onPointerMove);
      slider.removeEventListener("pointerup", onPointerUp);
      slider.removeEventListener("pointercancel", onPointerCancel);
      slider.removeEventListener("pointerleave", onPointerLeave);
      slider.removeEventListener("keydown", onKeyDown);
    };
  }, [reducedMotion, finePointer]);

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
        aria-valuenow={Math.round(REST_PHASE * 100)}
        aria-valuetext={phaseName(REST_PHASE)}
        className="moon-slider pointer-events-auto touch-pan-y select-none rounded-full"
      >
        <div ref={tiltRef} className="moon-tilt">
          <HeroMoon className="w-full h-auto" />
        </div>
      </div>
      {/* Until the first interaction; kept in memory only. */}
      <p
        aria-hidden="true"
        data-hidden={hintVisible ? undefined : ""}
        className="moon-hint mt-1 whitespace-nowrap text-right lg:text-center font-mono text-[11px] tracking-wide text-muted-foreground"
      >
        drag to change the phase
      </p>
    </div>
  );
};

export default HeroMoonControl;

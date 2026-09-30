import { useEffect, useRef, useState } from "react";
import { animate } from "animejs/animation";
import { createSpring } from "animejs/easings/spring";
import { cn } from "../lib/utils";
import {
  REST_PHASE,
  SATELLITE_REST,
  satellitePoint,
} from "../lib/heroMoonGeometry";
import { createMoonSphere, loadMoonTexture } from "../lib/moonSphere";
import { getScrollPhase, subscribeScrollPhase } from "../lib/scrollPhase";
import {
  useFinePointer,
  usePrefersReducedMotion,
} from "../hooks/usePrefersReducedMotion";
import moonAvif from "../assets/moon/moon-1024.avif";
import moonWebp from "../assets/moon/moon-1024.webp";
import HeroMoon3D from "./HeroMoon3D";

// The hero moon, made playable. It is a slider (0 = new, 100 = full):
//
//   drag left/right   move the terminator (and turn the sphere a little);
//                     release springs to the nearest of new / crescent /
//                     first quarter / gibbous / full
//   tap or click      step to the next of those; the satellite runs a lap
//   arrow keys        previous/next; Home/End jump to new/full
//   hover (desktop)   the sphere turns toward the pointer; the orbit brightens
//
// Left alone it follows scroll progress, waxing from its resting gibbous to
// full by the Contact section (the navbar moon keeps the whole new → full
// range). After a visitor sets it, the next scroll eases it back to following.
// The moon is a lit sphere on a canvas (lib/moonSphere.js): frames are drawn
// only when something changes; on desktop it also turns very slowly while the
// hero is on screen and the tab is visible. Phones and reduced motion: one
// frame per phase change, no idle turn, no hover. Every live value is in a
// ref, so moving the pointer never re-renders React.

const STOPS = [0, 0.25, 0.5, 0.75, 1];
const DRAG_THRESHOLD_PX = 6;
const HOVER_TURN = { lon: 0.16, lat: 0.1 }; // radians at the edge (~9° / 6°)
const DRAG_TURN = 0.22; // radians of turn for a full-width drag
const SNAP_SPRING = { bounce: 0.25, duration: 520 };
const LAP_MS = 1600;
// Canvas resolution cap: frames must stay well under 4ms on a desktop
// (measured: ~2.4ms when the sphere turns, ~1.3ms for a phase change). The
// disc shows at up to ~340 CSS px, a mild upscale of a photographic texture.
const MAX_CANVAS_PX = 256;
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
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const [hintVisible, setHintVisible] = useState(true);
  const live = useRef({ phase: REST_PHASE, mode: "follow", texture: null });

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return undefined;
    const s = live.current;
    const q = (selector) => slider.querySelector(selector);
    const disc = q("[data-moon-disc]");
    const canvas = q("canvas");
    const animated = finePointer && !reducedMotion; // idle turn + hover
    let frame = 0;
    let pendingPhase = null;
    let visible = true;
    let tabVisible = document.visibilityState === "visible";
    let spring = null;
    let lap = null;
    let drag = null;
    let lastInteraction = 0;
    let sphere = null;
    let disposed = false;

    // ---- The sphere ----
    const buildSphere = () => {
      const width = disc.getBoundingClientRect().width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.max(64, Math.min(MAX_CANVAS_PX, Math.round(width * dpr)));
      if (sphere && canvas.width === px) return;
      sphere?.destroy();
      canvas.width = px;
      canvas.height = px;
      sphere = createMoonSphere(canvas);
      canvas.__moon = sphere; // for measurement in tests
      if (s.texture) sphere.setTexture(s.texture.data, s.texture.w, s.texture.h);
      sphere.setPhase(s.phase);
      sphere.drawNow();
      disc.setAttribute("data-ready", "");
      updateIdle();
    };
    const updateIdle = () =>
      sphere?.setIdle(animated && visible && tabVisible);

    // ---- Painting ----
    const paint = (phase) => {
      sphere?.setPhase(phase);
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
            updateIdle();
          })
        : null;
    observer?.observe(slider);

    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      updateIdle();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Resize: rebuild only when the canvas resolution would change.
    const resizer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => buildSphere())
        : null;
    resizer?.observe(disc);
    buildSphere();

    // The texture arrives after the page is up; until then the sphere is
    // lit but plain (and before its first frame, a flat circle in CSS).
    if (!s.texture) {
      loadMoonTexture(moonAvif)
        .catch(() => loadMoonTexture(moonWebp))
        .then((texture) => {
          s.texture = texture;
          if (!disposed) sphere?.setTexture(texture.data, texture.w, texture.h);
        })
        .catch(() => {
          /* keep the plain sphere */
        });
    }

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
        const move = (event.clientX - drag.x) / drag.width;
        pendingPhase = clamp01(drag.start + move / 0.9);
        if (!reducedMotion) {
          sphere?.setTarget(Math.max(-DRAG_TURN, Math.min(DRAG_TURN, move * DRAG_TURN * 2)), 0);
        }
        schedule();
        return;
      }
      if (!animated || event.pointerType !== "mouse") return;
      const rect = slider.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      sphere?.setTarget(nx * HOVER_TURN.lon, -ny * HOVER_TURN.lat);
    };

    const endDrag = (event, cancelled) => {
      if (!drag || event.pointerId !== drag.id) return;
      const { moved } = drag;
      drag = null;
      if (!moved && cancelled) return; // the browser took it for a scroll
      lastInteraction = performance.now();
      if (pendingPhase !== null) flush();
      if (moved && !animated) sphere?.setTarget(0, 0);
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
      sphere?.setTarget(0, 0);
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
      disposed = true;
      cancelAnimationFrame(frame);
      spring?.cancel();
      lap?.cancel();
      sphere?.destroy();
      unsubscribe();
      observer?.disconnect();
      resizer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
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
        <HeroMoon3D className="w-full" />
      </div>
      {/* Centred directly under the disc, below the lower tick; fades after
          the first interaction (kept in memory only). */}
      <p
        aria-hidden="true"
        data-hidden={hintVisible ? undefined : ""}
        className="moon-hint pointer-events-none absolute left-1/2 top-[88%] -translate-x-1/2 w-max max-w-[8.5rem] sm:max-w-none text-center font-mono text-[11px] leading-snug tracking-wide text-muted-foreground"
      >
        drag to change the phase
      </p>
    </div>
  );
};

export default HeroMoonControl;

import { useEffect, useRef, useState } from "react";
import { frameValue, isCountable, planAnimation } from "../lib/countUp";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const DEFAULT_DURATION_MS = 1200;

// Counts from 0 to `target` on the animation clock — not per frame — so the
// run takes the same time whether it counts to 12 or to 120,000.
//
//   active     start only when told to (in view AND data loaded)
//   duration   ms, default 1200
//   quantize   step down to this multiple while running; exact on the last
//              frame. Per-stat, default 1.
//   replayKey  change it to run the whole thing again from zero.
//
// Returns an integer, or null when there is nothing to count to yet.
export const useCountUp = (
  target,
  {
    active = false,
    duration = DEFAULT_DURATION_MS,
    quantize = 1,
    replayKey = 0,
  } = {},
) => {
  const reducedMotion = usePrefersReducedMotion();
  const countable = isCountable(target);
  const animating = countable && active && !reducedMotion;

  const [frame, setFrame] = useState(null);
  // The plan survives re-renders and StrictMode's double-invoked effects;
  // `current` is what is on screen right now.
  const planRef = useRef(null);
  const frameRef = useRef(0);
  const replayRef = useRef(replayKey);

  useEffect(() => {
    if (!animating) {
      planRef.current = null;
      return undefined;
    }

    const now = performance.now();
    const previous = planRef.current;
    const isReplay = replayRef.current !== replayKey;
    replayRef.current = replayKey;

    // Re-running for the same target (StrictMode, an unrelated re-render)
    // resumes the existing plan rather than starting over.
    if (!previous || previous.to !== target || isReplay) {
      planRef.current = planAnimation({
        previous,
        to: target,
        now,
        duration,
        replay: isReplay,
      });
    }

    const tick = () => {
      const plan = planRef.current;
      if (!plan) return;

      const next = frameValue({
        from: plan.from,
        to: plan.to,
        elapsed: performance.now() - plan.start,
        duration: plan.duration,
        quantize,
      });

      plan.current = next;
      setFrame(next);

      if (next !== plan.to) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, animating, duration, quantize, replayKey]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  if (!countable) return null;
  // Reduced motion lands on the real value with no animation at all.
  if (reducedMotion) return Math.round(target);
  // Loaded but not triggered yet, or triggered but the first frame has not
  // run: hold at zero rather than flashing the answer.
  if (!active) return 0;
  return frame ?? 0;
};

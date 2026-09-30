// ---- One driver for every counting number ----
//
// A single requestAnimationFrame loop runs all active count-ups (the Stats
// numbers, ring and bars) and stops when none are left. Each frame's value
// comes from lib/countUp.js's `frameValue` — the same maths `useCountUp`
// uses — so every count ends on exactly the same integer, and a quantized
// count (the rank) steps while running but lands exact.

import { frameValue } from "./countUp";

const tweens = new Map(); // counter -> { from, to, start, duration, quantize }
let frame = 0;

const tick = (now) => {
  frame = 0;
  for (const [counter, tween] of tweens) {
    const elapsed = now - tween.start;
    if (elapsed < 0) continue; // still in its stagger delay
    const value = frameValue({
      from: tween.from,
      to: tween.to,
      elapsed,
      duration: tween.duration,
      quantize: tween.quantize,
    });
    counter.current = value;
    counter.render(value);
    if (elapsed >= tween.duration) {
      tweens.delete(counter);
      counter.running = false;
    }
  }
  if (tweens.size) frame = requestAnimationFrame(tick);
};

// Count `counter` from `from` to `to`. A counter is any object with a
// `render(value)` method; the driver keeps `current` and `running` on it.
export const playCount = (
  counter,
  { from, to, duration, delay = 0, quantize = 1 },
) => {
  counter.running = true;
  tweens.set(counter, {
    from,
    to,
    duration,
    quantize,
    start: performance.now() + delay,
  });
  if (!frame) frame = requestAnimationFrame(tick);
};

export const stopCount = (counter) => {
  tweens.delete(counter);
  counter.running = false;
};

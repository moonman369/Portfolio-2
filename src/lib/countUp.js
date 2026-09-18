// ---- Count-up maths ----
//
// Kept apart from the hook so the easing, retargeting and quantize rules can
// be exercised without a DOM. See scripts/test-count-up.mjs.

export const easeOutCubic = (t) => 1 - (1 - t) ** 3;

// Anything else — null, undefined, NaN, a string — means "no value yet".
export const isCountable = (value) =>
  typeof value === "number" && Number.isFinite(value);

// A retarget lands over this long when the previous animation had already
// finished, and is the floor for one that is still in flight.
export const RETARGET_DURATION_MS = 400;

// The value to paint this frame. Past the duration it returns the exact
// target: the final frame always snaps, whatever `quantize` says.
export const frameValue = ({
  from,
  to,
  elapsed,
  duration,
  quantize = 1,
}) => {
  if (!isCountable(to)) return null;
  if (!(duration > 0) || elapsed >= duration) return Math.round(to);

  const progress = easeOutCubic(Math.max(0, elapsed) / duration);
  const raw = from + (to - from) * progress;
  const step = isCountable(quantize) && quantize > 1 ? quantize : 1;

  // While running, step down to the nearest multiple so the number visibly
  // ticks rather than smearing through every digit.
  return step > 1 ? Math.floor(raw / step) * step : Math.round(raw);
};

// Plan the next leg. A first run counts up from zero over the full duration;
// a change of target mid-flight carries on from whatever is on screen, and
// never restarts at zero.
export const planAnimation = ({ previous, to, now, duration, replay = false }) => {
  if (!previous || replay) {
    return { from: 0, to, start: now, duration };
  }

  const remaining = Math.max(0, previous.start + previous.duration - now);
  return {
    // `current` is only set once a frame has run; before that, zero.
    from: isCountable(previous.current) ? previous.current : 0,
    to,
    start: now,
    // Still in flight: use what is left of the clock, but never so little
    // that the correction looks like a jump.
    duration: remaining > 0 ? Math.max(remaining, RETARGET_DURATION_MS) : RETARGET_DURATION_MS,
  };
};

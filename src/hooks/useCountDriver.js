import { useEffect, useLayoutEffect, useRef } from "react";
import { isCountable } from "../lib/countUp";
import { playCount, stopCount } from "../lib/countDriver";
import { useMediaQuery, usePrefersReducedMotion } from "./usePrefersReducedMotion";

// Binds one number (and anything that moves with it, via `onValue`) to the
// shared count driver (lib/countDriver.js).
//
//   first reveal   when `active` turns true and the value exists, it counts
//                  from 0 (after `delay`, for staggering)
//   new data       a value arriving later counts on from what is shown
//                  (cached → fresh), never from 0 again
//   replay         hovering it (mouse) or tapping it (coarse pointers)
//                  counts it again from 0; ignored while it is running
//   0 or missing   shown as is, never animated
//   reduced motion the final value at once, no replay
//
// Returns [ref, handlers]: put the ref on an element React renders no
// children into (the text is written with textContent only), and spread the
// handlers where the pointer should trigger a replay.
export const useCountDriver = (
  value,
  {
    active = false,
    delay = 0,
    duration = 1200,
    replayDuration = 700,
    retargetDuration = 800,
    quantize = 1,
    format = String,
    onValue,
  } = {},
) => {
  const ref = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const coarse = useMediaQuery("(pointer: coarse)");
  // The driver's handle for this number (mutable, so it lives in a ref).
  const counterRef = useRef({
    current: 0,
    running: false,
    played: false,
    target: null,
    render: () => {},
  });
  const formatRef = useRef(format);
  const onValueRef = useRef(onValue);

  const countable = isCountable(value) && value !== 0;
  const animated = countable && !reducedMotion;

  // Keep the latest formatter and side-effect, and the writer that uses them.
  useLayoutEffect(() => {
    formatRef.current = format;
    onValueRef.current = onValue;
    counterRef.current.render = (v) => {
      if (ref.current) ref.current.textContent = formatRef.current(v);
      onValueRef.current?.(v);
    };
  });

  // What is on screen before (or instead of) any counting: the plain value,
  // or 0 while a count is still to come.
  useLayoutEffect(() => {
    const counter = counterRef.current;
    if (!animated) {
      stopCount(counter);
      counter.current = isCountable(value) ? value : 0;
      counter.render(counter.current);
      return;
    }
    if (!counter.played) counter.render(0);
  }, [animated, value]);

  // First reveal, then later data.
  useEffect(() => {
    const counter = counterRef.current;
    if (!animated || !active) return;
    if (!counter.played) {
      counter.played = true;
      counter.target = value;
      playCount(counter, { from: 0, to: value, duration, delay, quantize });
    } else if (counter.target !== value) {
      counter.target = value;
      playCount(counter, {
        from: counter.current,
        to: value,
        duration: retargetDuration,
        quantize,
      });
    }
  }, [animated, active, value, duration, delay, quantize, retargetDuration]);

  useEffect(() => {
    const counter = counterRef.current;
    return () => stopCount(counter);
  }, []);

  const replay = () => {
    const counter = counterRef.current;
    if (!animated || !counter.played || counter.running) return;
    playCount(counter, { from: 0, to: value, duration: replayDuration, quantize });
  };

  const handlers = animated
    ? {
        onPointerEnter: (event) => {
          if (event.pointerType === "mouse") replay();
        },
        onPointerDown: (event) => {
          if (coarse || event.pointerType === "touch") replay();
        },
      }
    : {};

  return [ref, handlers];
};

// ---- Idle freeze ----
//
// After IDLE_MS without pointer, scroll, touch or key input, the page's
// always-on decorative motion holds still: <html> gets `data-idle` (CSS
// pauses the glows, the lunar drift and the CSS twinkles where they are), and
// subscribers are told (the star worker stops new meteors and pauses the
// twinkles; the hero moon pauses its slow turn). The next input resumes
// everything from the same point. Functional motion (the chat's thinking
// state, springs, count-ups) is never frozen.
//
// One set of passive listeners for the whole page; the timer is not reset on
// every pointer move, only re-armed when it fires early.

export const IDLE_MS = 30_000;
const EVENTS = ["pointermove", "pointerdown", "wheel", "scroll", "keydown", "touchstart"];

const listeners = new Set();
let idle = false;
let lastInput = 0;
let timer = 0;
let started = false;

const setIdle = (value) => {
  if (idle === value) return;
  idle = value;
  document.documentElement.toggleAttribute("data-idle", value);
  listeners.forEach((listener) => listener(value));
};

const check = () => {
  const quiet = performance.now() - lastInput;
  if (quiet >= IDLE_MS) {
    timer = 0;
    setIdle(true);
  } else {
    timer = setTimeout(check, IDLE_MS - quiet);
  }
};

const onInput = () => {
  lastInput = performance.now();
  if (idle) setIdle(false);
  if (!timer) timer = setTimeout(check, IDLE_MS);
};

const start = () => {
  if (started || typeof window === "undefined") return;
  started = true;
  EVENTS.forEach((type) =>
    window.addEventListener(type, onInput, { passive: true, capture: true }),
  );
  onInput();
};

export const isIdle = () => idle;

// Returns an unsubscribe function. The first subscriber starts the tracker;
// it stays on for the rest of the visit (a handful of passive listeners).
export const subscribeIdle = (listener) => {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
};

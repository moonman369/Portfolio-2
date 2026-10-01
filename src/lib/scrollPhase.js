// ---- Scroll progress, shared ----
//
// The navbar's moon already measures scroll progress (0 at the top of the
// page, 1 at Contact) once per animation frame. It publishes the value here
// so the hero moon can follow it without a second scroll listener.

const listeners = new Set();
let current = 0;

export const publishScrollPhase = (progress) => {
  current = progress;
  listeners.forEach((listener) => listener(progress));
};

export const getScrollPhase = () => current;

// Returns an unsubscribe function.
export const subscribeScrollPhase = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

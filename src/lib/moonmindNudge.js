// ---- The Moonmind nudge: shared state ----
//
// One small bubble per visit, anchored to whichever Moonmind entry point is
// actually on screen (the floating launcher, else the bottom-nav button).
// The trigger (hooks/useMoonmindNudge.js) decides when and where; each
// anchor's <MoonmindNudge> renders it when the store names that anchor.

const STORAGE_KEY = "moonmind_nudge_seen";

let state = { anchor: null };
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

export const nudgeStore = {
  get: () => state,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const showNudge = (anchor) => {
  state = { anchor };
  emit();
};

export const hideNudge = () => {
  if (!state.anchor) return;
  state = { anchor: null };
  emit();
};

// Shown once per visit, and never after the chat has been opened: both are
// remembered for the tab's session.
export const nudgeSeen = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

export const markNudgeSeen = () => {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* storage unavailable: it simply may show again next load */
  }
};

// Is the element rendered (not display:none, not hidden)?
const displayed = (el) =>
  !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";

// The floating launcher when it is displayed, otherwise the bottom-nav
// button; null if neither is on screen.
export const pickNudgeAnchor = () => {
  for (const anchor of ["launcher", "bar"]) {
    if (displayed(document.querySelector(`[data-moonmind-anchor="${anchor}"]`))) {
      return anchor;
    }
  }
  return null;
};

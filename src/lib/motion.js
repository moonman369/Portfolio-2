import { waapi } from "animejs/waapi";
import { stagger } from "animejs/utils";

// ---- Motion tokens ----
//
// The only place motion values live. JS animations import these directly; CSS
// transitions read the same numbers through the --motion-* custom properties
// that `applyMotionTokens` writes on <html> before the first render.

export const DURATION = Object.freeze({
  fast: 150, // hover, press
  base: 300, // fades, small rises
  slow: 600, // entrances, each stroke of the moon
});

// anime.js easing names. `EASE_CSS` holds the matching cubic-béziers.
export const EASE = Object.freeze({
  out: "out(3)",
  inOut: "inOut(3)",
  expo: "outExpo",
});

export const EASE_CSS = Object.freeze({
  out: "cubic-bezier(0.33, 1, 0.68, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  expo: "cubic-bezier(0.16, 1, 0.3, 1)",
});

// Gap between siblings in an entrance. Characters use half of it.
export const STAGGER = 60;

// How far an entering block travels, in px.
export const RISE = 14;

// The one spring, for the Moonmind launcher → panel morph.
export const SPRING = Object.freeze({ bounce: 0.2, duration: 450 });

export const applyMotionTokens = (root = document.documentElement) => {
  const { style } = root;
  for (const [name, ms] of Object.entries(DURATION)) {
    style.setProperty(`--motion-${name}`, `${ms}ms`);
  }
  for (const [name, curve] of Object.entries(EASE_CSS)) {
    style.setProperty(`--motion-ease-${name}`, curve);
  }
  style.setProperty("--motion-stagger", `${STAGGER}ms`);
};

// ---- Shared entrance ----
//
// Fade + rise on the compositor (WAAPI), staggered in DOM order. anime.js runs
// WAAPI with `fill: "both"`, so each element holds its start state through its
// delay with no extra style writes — and, crucially, no style reads, which on
// a freshly rendered page would force a full recalculation. Call it inside an
// anime.js scope so it is reverted on unmount.
export const rise = (
  targets,
  { delay = 0, step = STAGGER, duration = DURATION.slow, distance = RISE } = {},
) =>
  waapi.animate(targets, {
    opacity: [0, 1],
    transform: [`translateY(${distance}px)`, "translateY(0px)"],
    duration,
    delay: stagger(step, { start: delay }),
    ease: EASE.expo,
  });

// ---- Ambient motion ----
//
// The always-on decoration — meteors, twinkles and the button glows — costs
// real rendering work (animated layers, blurred halos). Painting it in the
// first frames delayed the hero text by ~0.6s on a slow phone, so it switches
// on a moment after the page has loaded: CSS keeps it off until <html> has
// the `ambient` class, then fades it in.
export const AMBIENT_DELAY_MS = 1200;

export const enableAmbientMotion = (root = document.documentElement) => {
  const start = () =>
    setTimeout(() => {
      root.classList.add("ambient");
      window.dispatchEvent(new Event("ambient"));
    }, AMBIENT_DELAY_MS);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
};

// Run `callback` once ambient motion is allowed (now, if it already is).
// Returns a function that cancels the wait.
export const whenAmbient = (callback) => {
  if (document.documentElement.classList.contains("ambient")) {
    callback();
    return () => {};
  }
  window.addEventListener("ambient", callback, { once: true });
  return () => window.removeEventListener("ambient", callback);
};

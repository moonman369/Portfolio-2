import { useEffect } from "react";

// Decorative loops stop when nobody can see them (see "Idle cost" in
// index.css):
//
//   off-screen   each element matching `selector` gets `data-offscreen` while
//                it is more than MARGIN_PX outside the viewport; CSS then
//                removes its looping animation. It restarts before it scrolls
//                back into view (the margin), so nothing visibly jumps.
//   hidden tab   <html> gets `data-tab-hidden`; CSS pauses every animation
//                where it is, and they resume from the same point.
//
// Fixed elements (the navbar pill, the launcher) are always in view and so
// keep running. Elements are collected when the page mounts; the glows are
// static parts of their sections.
const MARGIN_PX = 96;
export const DECOR_SELECTOR = ".btn-glow, .btn-glow-blue";

export const useOffscreenPause = (selector = DECOR_SELECTOR) => {
  useEffect(() => {
    const root = document.documentElement;
    const onVisibility = () =>
      root.toggleAttribute("data-tab-hidden", document.visibilityState === "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    const elements = [...document.querySelectorAll(selector)];
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) =>
              entries.forEach((entry) =>
                entry.target.toggleAttribute("data-offscreen", !entry.isIntersecting),
              ),
            { rootMargin: `${MARGIN_PX}px 0px` },
          )
        : null;
    elements.forEach((el) => observer?.observe(el));

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      elements.forEach((el) => el.removeAttribute("data-offscreen"));
    };
  }, [selector]);
};

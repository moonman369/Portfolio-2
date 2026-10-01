import { useEffect, useRef } from "react";
import { rise } from "../lib/motion";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

// Scroll entrances for a section. Every `[data-reveal]` inside the returned
// ref rises in once, the first time it comes into view, and never again.
// Elements that arrive together are staggered.
//
// While motion is allowed the section renders `data-reveal-pending`, and CSS
// holds its `[data-reveal]` children hidden until their turn (see index.css).
// The animation (WAAPI, fill: both) takes over the start state, and its
// committed end state outlives the CSS hold. With reduced motion there is no
// hold and nothing moves.
export const useReveal = () => {
  const ref = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion) return undefined;

    const targets = [...root.querySelectorAll("[data-reveal]")];
    if (typeof IntersectionObserver === "undefined") {
      root.removeAttribute("data-reveal-pending");
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const arriving = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target);
        if (!arriving.length) return;
        arriving.forEach((el) => observer.unobserve(el));
        rise(arriving);
      },
      // Start a little before the element is fully on screen.
      { rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reducedMotion]);

  return { ref, pending: !reducedMotion };
};

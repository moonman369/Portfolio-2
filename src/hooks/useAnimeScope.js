import { useEffect, useLayoutEffect, useRef } from "react";
import { createScope } from "animejs/scope";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

// Runs `setup` inside an anime.js scope rooted at the returned ref, following
// the anime.js v4 React guide. Everything created in `setup` is reverted when
// the component unmounts — including between StrictMode's double mount — so
// no animation or inline style outlives it.
//
//   setup(scope, { reducedMotion })  may return a cleanup function.
//
// With reduced motion the scope is still created (so `setup` can bail out
// early) and the content must already be in its final state.
//
// By default setup runs in a layout effect, so start states land before the
// first paint. `afterPaint: true` defers it to the frame after the first
// paint instead, so any layout it reads (splitting text, measuring paths) is
// done on a settled page rather than forced in the middle of the initial
// render. The component is then responsible for hiding its start state in CSS
// until setup runs.
const startScope = (root, setupRef, reducedMotion) =>
  createScope({ root }).add((self) =>
    setupRef.current(self, { reducedMotion }),
  );

export const useAnimeScope = (setup, { afterPaint = false } = {}) => {
  const root = useRef(null);
  const setupRef = useRef(setup);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    setupRef.current = setup;
  });

  // Default: before the first paint.
  useLayoutEffect(() => {
    if (afterPaint) return undefined;
    const scope = startScope(root, setupRef, reducedMotion);
    return () => scope.revert();
  }, [reducedMotion, afterPaint]);

  // `afterPaint`: two frames later — the first lands before the paint, the
  // second after it.
  useEffect(() => {
    if (!afterPaint) return undefined;
    let scope = null;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        scope = startScope(root, setupRef, reducedMotion);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      scope?.revert();
    };
  }, [reducedMotion, afterPaint]);

  return root;
};

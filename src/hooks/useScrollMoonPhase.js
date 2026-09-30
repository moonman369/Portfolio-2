import { useEffect, useState } from "react";
import { moonPhasePath } from "../lib/moonPhase";
import { publishScrollPhase } from "../lib/scrollPhase";

// Scroll progress from the top of the page (new moon) to the target section
// (full moon), published through lib/scrollPhase.js and, if `pathRef` holds
// an SVG path, written straight onto its `d`.
//
// Scrolling only schedules one animation frame; that frame quantises progress
// to `steps` and touches the DOM only when the step changes. React state is
// used for the "scrolled" flag alone, and only when it flips.
export const useScrollMoonPhase = (
  pathRef,
  { targetId = "contact", steps = 60, offset = 72 } = {},
) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    let lastStep = -1;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 10);

      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      const target = document.getElementById(targetId);
      const targetTop = target
        ? target.getBoundingClientRect().top + y - offset
        : maxScroll;
      const end = Math.min(maxScroll, targetTop);
      const progress = end > 0 ? Math.min(1, Math.max(0, y / end)) : 0;
      const step = Math.round(progress * steps);

      // The progress is published for every subscriber (the navbar's mark
      // listens there); a path, when one is given, is written too.
      if (step !== lastStep) {
        lastStep = step;
        pathRef?.current?.setAttribute("d", moonPhasePath(step / steps));
        publishScrollPhase(step / steps);
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathRef, targetId, steps, offset]);

  return scrolled;
};

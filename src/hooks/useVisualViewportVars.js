import { useEffect } from "react";

// How much the visual viewport has to shrink before we call it a keyboard.
const KEYBOARD_THRESHOLD_PX = 120;

// Mirrors the visual viewport onto an element as CSS custom properties, so a
// fixed panel can stay inside what is actually visible when the on-screen
// keyboard opens (iOS Safari and Android Chrome both shrink the visual
// viewport, not the layout viewport):
//
//   --vv-top     visual viewport offset from the layout viewport top
//   --vv-height  visual viewport height
//   data-keyboard="open" while the keyboard is up
//
// Display only: nothing here changes what the element does.
export const useVisualViewportVars = (ref, enabled = true) => {
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = ref.current;
    if (!enabled || !viewport || !element) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      element.style.setProperty("--vv-top", `${viewport.offsetTop}px`);
      element.style.setProperty("--vv-height", `${viewport.height}px`);
      const keyboard =
        window.innerHeight - viewport.height > KEYBOARD_THRESHOLD_PX;
      if (keyboard) element.dataset.keyboard = "open";
      else delete element.dataset.keyboard;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    viewport.addEventListener("resize", schedule);
    viewport.addEventListener("scroll", schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", schedule);
      viewport.removeEventListener("scroll", schedule);
    };
  }, [ref, enabled]);
};

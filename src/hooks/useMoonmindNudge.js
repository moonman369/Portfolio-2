import { useEffect, useRef } from "react";
import {
  hideNudge,
  markNudgeSeen,
  nudgeSeen,
  pickNudgeAnchor,
  showNudge,
} from "../lib/moonmindNudge";

// When to show the Moonmind nudge (lib/moonmindNudge.js): about 7 seconds
// into the visit, or the first time About or Projects comes into view,
// whichever is first; never before MIN_DELAY_MS (so a deep link does not
// greet the visitor with it mid-load). Only once per visit, never while the
// chat is open, and never once the chat has been used in this visit.
// Mounted once, by <Moonmind> (the home page only). Everything is cleared on
// unmount.
const SHOW_AFTER_MS = 7000;
const MIN_DELAY_MS = 1500;
const SECTIONS = ["about", "projects"];

export const useMoonmindNudge = ({ isOpen, hasConversation }) => {
  const blockedRef = useRef(isOpen || hasConversation);

  // Opening the chat (or having a conversation) retires the nudge for good.
  useEffect(() => {
    blockedRef.current = isOpen || hasConversation;
    if (isOpen || hasConversation) {
      markNudgeSeen();
      hideNudge();
    }
  }, [isOpen, hasConversation]);

  useEffect(() => {
    if (nudgeSeen() || blockedRef.current) return undefined;
    const start = performance.now();
    let done = false;
    let floorTimer = 0;
    let observer = null;

    const fire = () => {
      if (done) return;
      const wait = MIN_DELAY_MS - (performance.now() - start);
      if (wait > 0) {
        clearTimeout(floorTimer);
        floorTimer = setTimeout(fire, wait);
        return;
      }
      done = true;
      clearTimeout(timer);
      observer?.disconnect();
      if (blockedRef.current || nudgeSeen()) return;
      const anchor = pickNudgeAnchor();
      if (!anchor) return;
      markNudgeSeen();
      showNudge(anchor);
    };

    const timer = setTimeout(fire, SHOW_AFTER_MS);
    if (typeof IntersectionObserver !== "undefined") {
      // "Enters view": at least a little way up the viewport, not a sliver.
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) fire();
        },
        { rootMargin: "0px 0px -30% 0px" },
      );
      SECTIONS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }

    return () => {
      done = true;
      clearTimeout(timer);
      clearTimeout(floorTimer);
      observer?.disconnect();
      hideNudge();
    };
  }, []);
};

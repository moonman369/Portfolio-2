import { useEffect, useRef } from "react";
import { whenAmbient } from "../lib/motion";
import { hideNudge, pickNudgeAnchor, showNudge } from "../lib/moonmindNudge";

// When to show the Moonmind intro (lib/moonmindNudge.js, MoonmindNudge): on
// every page load and reload, once the page has loaded and the hero's
// entrance has played (ambient motion + SETTLE_MS, ~2s in). Once per page
// load: coming back from /moonmind inside the site does not show it again.
// Never while the chat is open; opening the chat closes it. Mounted once, by
// <Moonmind> (the home page only). Everything is cleared on unmount.
const SETTLE_MS = 600;

// Memory only: a reload starts a new page and shows it again.
let shownThisLoad = false;

export const useMoonmindNudge = ({ isOpen }) => {
  const openRef = useRef(isOpen);

  useEffect(() => {
    openRef.current = isOpen;
    if (isOpen) hideNudge();
  }, [isOpen]);

  useEffect(() => {
    if (shownThisLoad) return undefined;
    let timer = 0;
    const cancelAmbient = whenAmbient(() => {
      timer = setTimeout(() => {
        if (shownThisLoad || openRef.current) return;
        const anchor = pickNudgeAnchor();
        if (!anchor) return;
        shownThisLoad = true;
        showNudge(anchor);
      }, SETTLE_MS);
    });
    return () => {
      cancelAmbient();
      clearTimeout(timer);
      hideNudge();
    };
  }, []);
};

import { lazy } from "react";

// The chat (and react-markdown + remark-gfm with it) is split out of the main
// bundle and fetched the first time it is needed. `preloadMoonmindChat` warms
// the chunk on intent — hover, focus or touch on a Moonmind trigger — so the
// panel usually opens with the code already there. Import is memoised by the
// module system, so calling it repeatedly is free.
export const loadMoonmindChat = () => import("../components/MoonmindChat");

export const preloadMoonmindChat = () => {
  loadMoonmindChat().catch(() => {
    /* offline or a stale deploy: the real open will retry and report */
  });
};

export const MoonmindChatLazy = lazy(loadMoonmindChat);

// Props that warm the chat chunk when someone is about to open it.
export const moonmindIntentProps = {
  onPointerEnter: preloadMoonmindChat,
  onFocus: preloadMoonmindChat,
  onTouchStart: preloadMoonmindChat,
};

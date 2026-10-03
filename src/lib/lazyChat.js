import { lazy } from "react";

// The chat (and react-markdown + remark-gfm with it) is split out of the main
// bundle and fetched the first time it is needed. `preloadMoonmindChat` warms
// the chunk on intent — hover, focus or touch on a Moonmind trigger — so the
// panel usually opens with the code already there. Import is memoised by the
// module system, so calling it repeatedly is free.
export const loadMoonmindChat = () => import("../components/MoonmindChat");
// The full page (/moonmind), which phones open directly. It is small; it is
// warmed with the chat on intent so a phone's sheet can slide straight up.
// Once loaded it is kept here and rendered directly (App.jsx): going through
// React.lazy again would suspend for a render and hold the reveal ~300ms.
let pageComponent = null;
export const loadMoonmindPage = () =>
  import("../pages/MoonmindPage").then((module) => {
    pageComponent = module.default;
    return module;
  });
export const loadedMoonmindPage = () => pageComponent;

export const preloadMoonmindChat = () => {
  Promise.all([loadMoonmindChat(), loadMoonmindPage()]).catch(() => {
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

// ---- Moonmind: switching between the panel and the full page ----
//
// Both views mount their own copy of the chat body, so two things have to be
// carried across:
//
//   where the reader was   the list's distance from its bottom, kept here
//                          (memory only) and restored instantly on mount:
//                          at the bottom stays at the bottom, higher up
//                          keeps the same distance from it
//   how it looks           a View Transition (progressive enhancement): the
//                          chat container is `view-transition-name: mm-chat`
//                          in both views, so the panel grows into the page
//                          and shrinks back. No support, or reduced motion:
//                          an instant switch with the same result.

export const listMemory = { fromBottom: 0 };

// The new view's chat calls `viewReady()` once it has mounted and restored
// its scroll position; the transition captures its "after" state then.
// Navigation commits asynchronously, so the update callback waits for that
// signal (or gives up after a moment and shows whatever is there).
let ready = null;
export const viewReady = () => {
  ready?.();
};

const READY_TIMEOUT_MS = 800;

export const switchView = (update, { reducedMotion = false } = {}) => {
  if (reducedMotion || typeof document.startViewTransition !== "function") {
    update();
    return;
  }
  document.startViewTransition(
    () =>
      new Promise((resolve) => {
        const timer = setTimeout(done, READY_TIMEOUT_MS);
        function done() {
          clearTimeout(timer);
          ready = null;
          resolve();
        }
        ready = done;
        update();
      }),
  );
};

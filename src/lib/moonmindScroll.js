// ---- Moonmind chat: scrolling the message list ----
//
// The list never uses CSS smooth scrolling (a remount would rewind it to the
// top and glide back down). Programmatic moves are either instant or this
// short tween, and the reader's own wheel or touch cancels a tween at once.

const easeOut = (t) => 1 - (1 - t) ** 3;
const tweens = new WeakMap();

export const scrollListTo = (el, top, { smooth = false, duration = 250 } = {}) => {
  tweens.get(el)?.();
  const target = Math.max(0, Math.min(top, el.scrollHeight - el.clientHeight));
  if (!smooth || Math.abs(target - el.scrollTop) < 2) {
    el.scrollTop = target;
    return;
  }
  const from = el.scrollTop;
  const start = performance.now();
  let frame = 0;
  const stop = () => {
    cancelAnimationFrame(frame);
    el.removeEventListener("wheel", stop);
    el.removeEventListener("touchstart", stop);
    tweens.delete(el);
  };
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.scrollTop = from + (target - from) * easeOut(t);
    if (t < 1) frame = requestAnimationFrame(step);
    else stop();
  };
  el.addEventListener("wheel", stop, { passive: true });
  el.addEventListener("touchstart", stop, { passive: true });
  tweens.set(el, stop);
  frame = requestAnimationFrame(step);
};

// Where a message starts, as a scrollTop that puts it `offset` px below the
// top of the list.
export const messageTop = (list, message, offset = 12) =>
  list.scrollTop +
  message.getBoundingClientRect().top -
  list.getBoundingClientRect().top -
  offset;

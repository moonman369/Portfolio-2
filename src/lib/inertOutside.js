// Make everything on the page except `element` (and anything marked
// `data-modal-keep`) inert: not focusable, not clickable, hidden from
// assistive tech. Walks from the element up to <body>, marking the siblings
// along the way. Returns a function that undoes exactly what it changed.
export const inertOutside = (element) => {
  const changed = [];
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    const parent = node.parentElement;
    if (!parent) break;
    for (const sibling of parent.children) {
      if (
        sibling === node ||
        sibling.inert ||
        sibling.hasAttribute("data-modal-keep") ||
        sibling.tagName === "SCRIPT"
      ) {
        continue;
      }
      sibling.inert = true;
      changed.push(sibling);
    }
  }
  return () => changed.forEach((sibling) => (sibling.inert = false));
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keep Tab and Shift+Tab inside `container`.
export const trapTab = (container, event) => {
  if (event.key !== "Tab") return;
  const items = [...container.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0,
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const current = document.activeElement;
  if (event.shiftKey && (current === first || current === container)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && current === last) {
    event.preventDefault();
    first.focus();
  }
};

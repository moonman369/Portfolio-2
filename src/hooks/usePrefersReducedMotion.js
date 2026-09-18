import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const matches = (query) =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(query).matches;

// Tracks a media query and keeps following it if the user changes the setting
// without reloading.
export const useMediaQuery = (query) => {
  const [enabled, setEnabled] = useState(() => matches(query));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const list = window.matchMedia(query);
    const onChange = (event) => setEnabled(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return enabled;
};

export const usePrefersReducedMotion = () => useMediaQuery(QUERY);

// Replays on hover are for mice and trackpads only — never touch.
export const useFinePointer = () =>
  useMediaQuery("(hover: hover) and (pointer: fine)");

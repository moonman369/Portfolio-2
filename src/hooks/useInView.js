import { useEffect, useRef, useState } from "react";

// Thin IntersectionObserver wrapper: attach the ref, read the boolean.
// One observer per element, disconnected on unmount.
export const useInView = ({
  threshold = 0.3,
  rootMargin = "0px",
  once = true,
} = {}) => {
  const ref = useRef(null);
  // Without IntersectionObserver there is no way to know — assume visible so
  // the content is never left in its pre-animation state.
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
};

import moonAvif from "../assets/moon/moon-1024.avif";
import moonWebp from "../assets/moon/moon-1024.webp";
import { loadMoonTexture } from "./moonSphere";

// One moon texture for every sphere on the page (the hero moon and each
// MoonMark): fetched and decoded once, and never before the page's `load`
// event, so it cannot compete with the first render. Callers get a promise
// of { data, w, h }; it rejects only if both formats fail, in which case the
// spheres stay lit but plain.
let texture = null;

const afterLoad = () =>
  new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });

export const getMoonTexture = () => {
  if (!texture) {
    texture = afterLoad().then(() =>
      loadMoonTexture(moonAvif).catch(() => loadMoonTexture(moonWebp)),
    );
  }
  return texture;
};

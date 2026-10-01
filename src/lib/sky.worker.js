// ---- Sky worker ----
//
// Owns the star canvas (transferred from the page as an OffscreenCanvas):
// paints the star field and runs the meteor shower here, so meteor frames
// never need a main-thread frame. The page only sends small messages:
//
//   init    { canvas, size }          take the canvas, paint the stars
//   config  { phone, meteors, twinkles }   phone limits; meteors / twinkling
//                                          stars allowed at all
//   run     { running, drain }        meteors: hero on screen, tab visible,
//                                     ambient on, not idle (`drain`: let the
//                                     ones in flight finish)
//   twinkle { running }               twinkles: tab visible, ambient on
//   resize  { size }                  repaint at a new size
//
// `size` is { width, height, dpr, viewportHeight } in CSS px.

import { paintStarfield } from "./starfield";
import { createMeteorShower } from "./meteors";
import { createTwinkles } from "./twinkles";

const hasRaf = typeof self.requestAnimationFrame === "function";
const raf = hasRaf
  ? (cb) => self.requestAnimationFrame(cb)
  : (cb) => setTimeout(() => cb(performance.now()), 16);
const caf = hasRaf
  ? (id) => self.cancelAnimationFrame(id)
  : (id) => clearTimeout(id);

let canvas = null;
let layer = null;
let size = null;
let shower = null;
let phone = null;
let meteorsAllowed = false;
let running = false;
let twinkles = null;
let twinklesAllowed = false;
let twinkling = false;

const apply = () => {
  if (shower) {
    if (meteorsAllowed && running) shower.start();
    else shower.stop();
  }
  if (twinkles) {
    if (twinklesAllowed && twinkling) twinkles.start();
    else twinkles.stop();
  }
};

const paint = () => {
  if (!canvas || !size?.width || !size?.height) return;
  paintStarfield({ canvas, layer, ...size });
  shower?.resize(size);
  twinkles?.resize(size);
};

self.onmessage = ({ data }) => {
  switch (data.type) {
    case "init":
      canvas = data.canvas;
      layer = new OffscreenCanvas(1, 1);
      size = data.size;
      paint();
      break;
    case "config":
      if (data.phone !== phone) {
        shower?.stop();
        phone = data.phone;
        shower = createMeteorShower({ canvas, starLayer: layer, phone, raf, caf });
        if (size) shower.resize(size);
      }
      meteorsAllowed = data.meteors;
      if (!twinkles) {
        twinkles = createTwinkles({ canvas, starLayer: layer, raf, caf });
        if (size) twinkles.resize(size);
      }
      twinklesAllowed = data.twinkles;
      apply();
      break;
    case "twinkle":
      twinkling = data.running;
      apply();
      break;
    case "run":
      running = data.running;
      if (!running && data.drain) shower?.drain();
      else apply();
      break;
    case "resize":
      shower?.stop();
      twinkles?.stop();
      size = data.size;
      paint();
      apply();
      break;
    default:
      break;
  }
};

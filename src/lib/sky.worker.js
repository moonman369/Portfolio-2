// ---- Sky worker ----
//
// Owns the star canvas (transferred from the page as an OffscreenCanvas):
// paints the star field and runs the meteor shower here, so meteor frames
// never need a main-thread frame. The page only sends small messages:
//
//   init    { canvas, size }          take the canvas, paint the stars
//   config  { phone, meteors }        phone limits; meteors allowed at all
//   run     { running }               hero on screen, tab visible, ambient on
//   resize  { size }                  repaint at a new size
//
// `size` is { width, height, dpr } in CSS px.

import { paintStarfield } from "./starfield";
import { createMeteorShower } from "./meteors";

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

const apply = () => {
  if (!shower) return;
  if (meteorsAllowed && running) shower.start();
  else shower.stop();
};

const paint = () => {
  if (!canvas || !size?.width || !size?.height) return;
  paintStarfield({ canvas, layer, ...size });
  shower?.resize(size);
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
      apply();
      break;
    case "run":
      running = data.running;
      apply();
      break;
    case "resize":
      shower?.stop();
      size = data.size;
      paint();
      apply();
      break;
    default:
      break;
  }
};

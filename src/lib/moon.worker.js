// ---- Hero moon worker ----
//
// Owns the hero moon's canvas (transferred from the page as an
// OffscreenCanvas) and runs lib/moonSphere.js here: the idle turn and every
// relit frame are drawn off the main thread, and a canvas animated from a
// worker never asks the page for a main-thread frame. The page sends small
// messages (lib/moonSphereHost.js):
//
//   init     { canvas, px, earthshine }   take the canvas at px × px
//   resize   { px }                       rebuild at a new resolution
//   texture  { data, w, h }               luma texture
//   phase    { value }                    cycle position
//   target   { lon, lat }                 drag turn
//   idle     { value }                    slow turn on/off
//   stats                                 reply with draw stats
//
// It replies "drawn" once after the first frame of each canvas size, and
// "stats" when asked.

import { createMoonSphere } from "./moonSphere";

const hasRaf = typeof self.requestAnimationFrame === "function";
const raf = hasRaf
  ? (cb) => self.requestAnimationFrame(cb)
  : (cb) => setTimeout(() => cb(performance.now()), 16);
const caf = hasRaf
  ? (id) => self.cancelAnimationFrame(id)
  : (id) => clearTimeout(id);

let canvas = null;
let sphere = null;
let earthshine;
// The latest of everything, re-applied when the sphere is rebuilt.
const state = { texture: null, phase: 0.25, target: [0, 0], idle: false };

const build = (px) => {
  sphere?.destroy();
  canvas.width = px;
  canvas.height = px;
  sphere = createMoonSphere(canvas, { earthshine, raf, caf });
  if (state.texture) sphere.setTexture(state.texture.data, state.texture.w, state.texture.h);
  sphere.setPhase(state.phase);
  sphere.setTarget(...state.target);
  sphere.drawNow();
  sphere.setIdle(state.idle);
  self.postMessage({ type: "drawn" });
};

self.onmessage = ({ data }) => {
  switch (data.type) {
    case "init":
      canvas = data.canvas;
      earthshine = data.earthshine;
      build(data.px);
      break;
    case "resize":
      if (canvas) build(data.px);
      break;
    case "texture":
      state.texture = data;
      sphere?.setTexture(data.data, data.w, data.h);
      break;
    case "phase":
      state.phase = data.value;
      sphere?.setPhase(data.value);
      break;
    case "target":
      state.target = [data.lon, data.lat];
      sphere?.setTarget(data.lon, data.lat);
      break;
    case "idle":
      state.idle = data.value;
      sphere?.setIdle(data.value);
      break;
    case "stats":
      self.postMessage({ type: "stats", id: data.id, stats: { ...sphere?.stats } });
      break;
    default:
      break;
  }
};

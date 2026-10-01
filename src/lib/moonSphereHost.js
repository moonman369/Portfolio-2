import { createMoonSphere } from "./moonSphere";

// The hero moon's sphere, in a worker where the browser can hand a canvas to
// one (lib/moon.worker.js), otherwise on this thread. Same operations either
// way:
//
//   resize(px)            (re)build at px × px; `onDrawn` fires after the
//                         first frame of each size
//   setTexture({data,w,h}), setPhase(cycle), setTarget(lon, lat), setIdle(on)
//   getStats()            a promise of { frames, lastFrameMs, ... }
//   destroy()
//
// In the worker, the idle turn and every relit frame cost the main thread
// nothing, and never make it render a frame (a canvas animated from the main
// thread does, and every running CSS animation then pays for that frame too).

// A canvas can be handed over only once, and StrictMode runs effects twice:
// keep the worker per canvas, and end it only once the canvas has left.
const workers = new WeakMap();

const canUseWorker = (canvas) =>
  typeof canvas.transferControlToOffscreen === "function" &&
  typeof Worker !== "undefined" &&
  typeof OffscreenCanvas !== "undefined";

export const createMoonSphereHost = (canvas, { onDrawn, earthshine } = {}) => {
  if (canUseWorker(canvas)) {
    let entry = workers.get(canvas);
    if (!entry) {
      const worker = new Worker(new URL("./moon.worker.js", import.meta.url), {
        type: "module",
      });
      entry = { worker, transferred: false, requests: new Map(), nextId: 1 };
      worker.onmessage = ({ data }) => {
        if (data.type === "drawn") entry.onDrawn?.();
        if (data.type === "stats") {
          entry.requests.get(data.id)?.(data.stats);
          entry.requests.delete(data.id);
        }
      };
      workers.set(canvas, entry);
    }
    entry.onDrawn = onDrawn;
    const post = (message, transfer) => entry.worker.postMessage(message, transfer ?? []);
    return {
      resize(px) {
        if (!entry.transferred) {
          const offscreen = canvas.transferControlToOffscreen();
          entry.transferred = true;
          post({ type: "init", canvas: offscreen, px, earthshine }, [offscreen]);
        } else {
          post({ type: "resize", px });
        }
      },
      // A copy: the page keeps its texture for the other moons.
      setTexture: ({ data, w, h }) => post({ type: "texture", data, w, h }),
      setPhase: (value) => post({ type: "phase", value }),
      setTarget: (lon, lat) => post({ type: "target", lon, lat }),
      setIdle: (value) => post({ type: "idle", value }),
      getStats: () =>
        new Promise((resolve) => {
          const id = entry.nextId++;
          entry.requests.set(id, resolve);
          post({ type: "stats", id });
        }),
      destroy() {
        post({ type: "idle", value: false });
        entry.onDrawn = null;
        setTimeout(() => {
          if (canvas.isConnected) return; // StrictMode re-run, not unmount
          entry.worker.terminate();
          workers.delete(canvas);
        }, 0);
      },
      inWorker: true,
    };
  }

  // Main-thread fallback: the sphere draws straight onto the canvas.
  let sphere = null;
  const state = { texture: null, phase: 0.25, target: [0, 0], idle: false };
  return {
    resize(px) {
      if (sphere && canvas.width === px) return;
      sphere?.destroy();
      canvas.width = px;
      canvas.height = px;
      sphere = createMoonSphere(canvas, { earthshine });
      if (state.texture) sphere.setTexture(state.texture.data, state.texture.w, state.texture.h);
      sphere.setPhase(state.phase);
      sphere.setTarget(...state.target);
      sphere.drawNow();
      sphere.setIdle(state.idle);
      onDrawn?.();
    },
    setTexture(texture) {
      state.texture = texture;
      sphere?.setTexture(texture.data, texture.w, texture.h);
    },
    setPhase(value) {
      state.phase = value;
      sphere?.setPhase(value);
    },
    setTarget(lon, lat) {
      state.target = [lon, lat];
      sphere?.setTarget(lon, lat);
    },
    setIdle(value) {
      state.idle = value;
      sphere?.setIdle(value);
    },
    getStats: () => Promise.resolve({ ...sphere?.stats }),
    destroy: () => sphere?.destroy(),
    inWorker: false,
  };
};

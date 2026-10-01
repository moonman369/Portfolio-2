import { useEffect, useRef } from "react";
import { createMeteorShower } from "../lib/meteors";
import { MAX_DPR, paintStarfield } from "../lib/starfield";
import { whenAmbient } from "../lib/motion";
import { isIdle, subscribeIdle } from "../lib/idleFreeze";
import {
  useMediaQuery,
  usePrefersReducedMotion,
} from "../hooks/usePrefersReducedMotion";
import SkyMotion from "./SkyMotion";

// The dark sky: a sparse, mostly static star field on one <canvas>, with
// meteors drawn onto the same canvas from a fixed pool (lib/meteors.js).
//
// Where supported the canvas is handed to a worker (lib/sky.worker.js), which
// paints the stars and runs the meteors off the main thread: a canvas
// animated from the main thread forces a main-thread frame every time it
// draws, and every running CSS animation pays for those frames too. Elsewhere
// the same code runs here.
//
// Meteors run only once ambient motion is on, while the hero is on screen and
// the tab is visible, and never with reduced motion. Six twinkling stars
// (lib/twinkles.js) are drawn in the worker too, on desktop, once ambient
// motion is on and while the tab is visible; without a worker they stay the
// CSS twinkles of SkyMotion. On desktop the canvas drifts very slowly with
// scroll through a CSS scroll timeline (see .stars-canvas), on the
// compositor.

// A canvas can be transferred only once, and StrictMode runs effects twice:
// the worker is kept per canvas element and ended when the canvas leaves.
const workers = new WeakMap();

const skyInWorker =
  typeof HTMLCanvasElement !== "undefined" &&
  typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function" &&
  typeof Worker !== "undefined";

const sizeOf = (canvas) => {
  const { width, height } = canvas.getBoundingClientRect();
  return {
    width,
    height,
    viewportHeight: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, MAX_DPR),
  };
};

// The same four operations, in a worker or on this thread.
const createSky = (canvas) => {
  if (skyInWorker) {
    let worker = workers.get(canvas);
    if (!worker) {
      worker = new Worker(new URL("../lib/sky.worker.js", import.meta.url), {
        type: "module",
      });
      const offscreen = canvas.transferControlToOffscreen();
      worker.postMessage({ type: "init", canvas: offscreen, size: sizeOf(canvas) }, [
        offscreen,
      ]);
      workers.set(canvas, worker);
    }
    return {
      config: (options) => worker.postMessage({ type: "config", ...options }),
      run: (running, drain) => worker.postMessage({ type: "run", running, drain }),
      twinkle: (running) => worker.postMessage({ type: "twinkle", running }),
      resize: () => worker.postMessage({ type: "resize", size: sizeOf(canvas) }),
      dispose: () => {
        worker.postMessage({ type: "run", running: false });
        worker.postMessage({ type: "twinkle", running: false });
        setTimeout(() => {
          if (canvas.isConnected) return; // StrictMode re-run, not unmount
          worker.terminate();
          workers.delete(canvas);
        }, 0);
      },
    };
  }

  // Main-thread fallback.
  const layer = document.createElement("canvas");
  let size = sizeOf(canvas);
  paintStarfield({ canvas, layer, ...size });
  let shower = null;
  let allowed = false;
  let running = false;
  const apply = () => {
    if (shower && allowed && running) shower.start();
    else shower?.stop();
  };
  return {
    config: ({ phone, meteors }) => {
      shower?.stop();
      shower = createMeteorShower({ canvas, starLayer: layer, phone });
      shower.resize(size);
      allowed = meteors;
      apply();
    },
    run: (value, drain) => {
      running = value;
      if (!value && drain) shower?.drain();
      else apply();
    },
    // Here the twinkles are SkyMotion's CSS stars.
    twinkle: () => {},
    resize: () => {
      shower?.stop();
      size = sizeOf(canvas);
      paintStarfield({ canvas, layer, ...size });
      shower?.resize(size);
      apply();
    },
    dispose: () => shower?.stop(),
  };
};

const StarBackground = () => {
  const canvasRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const phone = useMediaQuery("(pointer: coarse), (max-width: 767px)");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const sky = createSky(canvas);
    sky.config({
      phone,
      meteors: !reducedMotion,
      twinkles: !reducedMotion && !phone,
    });

    // Meteors run only while all of these hold; twinkles need all but the
    // hero. After 30s without input (lib/idleFreeze.js) no new meteors start
    // (the ones in flight finish) and the twinkles hold still.
    const state = {
      ambient: false,
      heroVisible: true,
      tabVisible: true,
      awake: !isIdle(),
    };
    let lastRunning = null;
    let lastTwinkling = null;
    const update = () => {
      const running =
        state.ambient && state.heroVisible && state.tabVisible && state.awake;
      if (running !== lastRunning) {
        lastRunning = running;
        sky.run(running, !state.awake);
      }
      const twinkling = state.ambient && state.tabVisible && state.awake;
      if (twinkling !== lastTwinkling) {
        lastTwinkling = twinkling;
        sky.twinkle(twinkling);
      }
    };

    const cancelAmbient = whenAmbient(() => {
      state.ambient = true;
      update();
    });

    const onVisibility = () => {
      state.tabVisible = document.visibilityState === "visible";
      update();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const unsubscribeIdle = subscribeIdle((idle) => {
      state.awake = !idle;
      update();
    });

    // Pages without a hero (/moonmind, 404) count as "hero visible".
    const hero = document.getElementById("hero");
    const observer =
      hero && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            state.heroVisible = entry.isIntersecting;
            update();
          })
        : null;
    observer?.observe(hero);

    // Only a width change is a real resize. Phones change height constantly
    // as the address bar shows and hides; the canvas is sized to the large
    // viewport so it never needs redrawing for that.
    let lastWidth = window.innerWidth;
    let timer = 0;
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(timer);
      timer = setTimeout(() => sky.resize(), 150);
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAmbient();
      unsubscribeIdle();
      observer?.disconnect();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      sky.dispose();
    };
  }, [reducedMotion, phone]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="stars-canvas fixed inset-x-0 top-0 w-full pointer-events-none z-0"
      />
      {!skyInWorker && <SkyMotion />}
    </>
  );
};

export default StarBackground;

// ---- A lit, textured moon on a small canvas ----
//
// The phase is a position in the lunar cycle (0 new → 0.25 first quarter →
// 0.5 full → 0.75 last quarter → 1 new): the sun sits to the right while the
// moon waxes and to the left while it wanes.
//
// Every pixel inside the disc is mapped once (per canvas size) to a point on
// a sphere: its latitude and longitude, plus how those change when the
// sphere tilts a little about the horizontal axis (first-order, which is
// exact enough for the few degrees of drag turn). A frame is then a
// handful of multiply-adds per pixel: look up the equirectangular texture,
// light it with Lambert from a sun set by the phase, soften the terminator,
// darken the limb and add a faint blue earthshine on the night side.
//
// Frames are drawn only when something changed (phase, texture, view) or
// while the view is still easing or idling; the loop stops at rest. Idle
// rotation runs at a steady 30fps, blending texels so it glides.

const IDLE_TURN_MS = 200_000; // a full turn in 200s
const IDLE_FRAME_MS = 1000 / 30;
const EASE = 0.18; // per-frame approach of the view to its target
const SETTLED = 0.0005; // radians

// The terminator's soft band, in n·l.
const EDGE_LO = -0.07;
const EDGE_SPAN = 0.21;

// `earthshine` is how bright the night side glows (small marks raise it so a
// new moon still reads as a sphere).
export const createMoonSphere = (canvas, { earthshine = 0.05 } = {}) => {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const radius = size / 2 - 1;
  const centre = size / 2;
  const image = ctx.createImageData(size, size);
  const out = new Uint32Array(image.data.buffer);

  // Per-pixel sphere geometry for the disc only: everything a frame needs,
  // precomputed as texture coordinates (u, v in 0..1) and their change per
  // radian of tilt, so the frame loop stays cheap. Written straight into
  // typed arrays (sized for the bounding square, then trimmed) — this runs
  // once per canvas size, on the main thread, during the hero's first second.
  const twoPi = Math.PI * 2;
  const max = size * size;
  const geo = {
    index: new Int32Array(max),
    nx: new Float32Array(max),
    nz: new Float32Array(max),
    u0: new Float32Array(max),
    du: new Float32Array(max),
    v0: new Float32Array(max),
    dv: new Float32Array(max),
    limb: new Float32Array(max),
    alpha: new Uint32Array(max),
  };
  const outer = (1 + 1 / radius) ** 2; // one pixel of anti-aliased edge
  let count = 0;
  for (let y = 0; y < size; y++) {
    const py = (centre - (y + 0.5)) / radius;
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5 - centre) / radius;
      const d2 = px * px + py * py;
      if (d2 > outer) continue;
      const d = Math.sqrt(d2);
      const cx = d2 < 1 ? px : px / d;
      const cy = d2 < 1 ? py : py / d;
      const z2 = 1 - cx * cx - cy * cy;
      const z = z2 > 0 ? Math.sqrt(z2) : 0;
      const cosLat = Math.max(Math.sqrt(1 - cy * cy), 0.05);
      const e = (1 - d) * radius + 0.5; // anti-aliased disc edge, 0..1
      geo.index[count] = y * size + x;
      geo.nx[count] = cx;
      geo.nz[count] = z;
      geo.u0[count] = Math.atan2(cx, z) / twoPi + 0.5;
      geo.du[count] = (cx * cy) / Math.max(cx * cx + z * z, 0.0025) / twoPi;
      geo.v0[count] = 0.5 - Math.asin(cy) / Math.PI;
      geo.dv[count] = -(z / cosLat) / Math.PI;
      geo.limb[count] = 0.8 + 0.2 * z;
      geo.alpha[count] = (((e < 0 ? 0 : e > 1 ? 1 : e) * 255) | 0) << 24;
      count++;
    }
  }
  for (const key in geo) geo[key] = geo[key].subarray(0, count);

  let texture = null; // { data: Uint8Array (luma), w, h }
  // The texture sample per pixel depends only on the view, so it is cached:
  // phase-only frames (drags, springs) just relight.
  const albedo = new Float32Array(count).fill(0.72);
  let sampledTilt = NaN;
  let sampledShift = NaN;
  let phase = 0.25; // cycle position
  const view = { lon: 0, lat: 0 }; // eased
  const target = { lon: 0, lat: 0 };
  let idleLon = 0;
  let idle = false;
  let dirty = true;
  let frame = 0;
  let lastIdleFrame = 0;
  const stats = { lastFrameMs: 0, loopMs: 0, sampleMs: 0, frames: 0 };

  const draw = () => {
    const t0 = performance.now();
    const angle = Math.PI * (1 - 2 * phase); // sun–viewer angle, signed
    const lx = Math.sin(angle);
    const lz = Math.cos(angle);
    const tilt = view.lat;
    const uShift = (view.lon + idleLon) / twoPi;
    const tex = texture?.data;
    const tw = texture?.w ?? 1;
    const th = texture?.h ?? 1;
    const vMax = th - 1;
    const { index: idx, nx: gx, nz: gz, u0, du, v0, dv, limb, alpha } = geo;

    if (tex && (tilt !== sampledTilt || uShift !== sampledShift)) {
      for (let i = 0; i < count; i++) {
        let u = u0[i] + tilt * du[i] + uShift;
        u -= Math.floor(u);
        let ty = ((v0[i] + tilt * dv[i]) * th) | 0;
        if (ty < 0) ty = 0;
        else if (ty > vMax) ty = vMax;
        // Blend the two nearest texels along the direction of spin, so the
        // surface glides through sub-texel shifts instead of stepping.
        const row = ty * tw;
        const ux = u * tw;
        const x0 = ux | 0;
        const x1 = x0 + 1 < tw ? x0 + 1 : 0;
        const a = tex[row + x0];
        albedo[i] = (a + (tex[row + x1] - a) * (ux - x0)) * 0.00392156863;
      }
      sampledTilt = tilt;
      sampledShift = uShift;
      stats.sampleMs = performance.now() - t0;
    }

    // Pixels outside the disc are never written, so they stay transparent.
    for (let i = 0; i < count; i++) {
      const ndl = gx[i] * lx + gz[i] * lz;

      // Sunlit: flat-ish (the moon is nearly uniform across its face), with
      // a soft terminator (smoothstep). Night side: faint cool earthshine.
      let t = (ndl - EDGE_LO) / EDGE_SPAN;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const lit = t * t * (3 - 2 * t);
      const shade = limb[i] * albedo[i];
      const sun = lit * (0.3 + 0.7 * (ndl > 0 ? Math.sqrt(ndl) : 0)) * shade;
      const earth = (1 - lit) * earthshine * shade;

      let r = (sun * 255 + earth * 140) | 0;
      let g = (sun * 250 + earth * 170) | 0;
      let bl = (sun * 240 + earth * 255) | 0;
      if (r > 255) r = 255;
      if (g > 255) g = 255;
      if (bl > 255) bl = 255;
      out[idx[i]] = alpha[i] | (bl << 16) | (g << 8) | r;
    }
    const t1 = performance.now();
    ctx.putImageData(image, 0, 0);
    stats.loopMs = t1 - t0;
    stats.lastFrameMs = performance.now() - t0;
    stats.frames++;
    dirty = false;
  };

  const tick = (now) => {
    frame = 0;

    let moving = false;
    // Ease the view toward its target (the drag turn).
    for (const key of ["lon", "lat"]) {
      const delta = target[key] - view[key];
      if (Math.abs(delta) > SETTLED) {
        view[key] += delta * EASE;
        moving = true;
        dirty = true;
      } else if (delta !== 0) {
        view[key] = target[key];
        dirty = true;
      }
    }
    // Idle rotation at a steady 30fps. The step follows the real time since
    // the last idle frame (so a slow frame never makes it lurch), and with
    // the sub-texel blend in draw() each frame moves the surface a fraction
    // of a pixel: a continuous glide.
    if (idle && now - lastIdleFrame >= IDLE_FRAME_MS - 4) {
      const step = lastIdleFrame ? Math.min(now - lastIdleFrame, 100) : IDLE_FRAME_MS;
      idleLon += (Math.PI * 2 * step) / IDLE_TURN_MS;
      lastIdleFrame = now;
      dirty = true;
    }

    if (dirty) draw();
    if (moving || idle) frame = requestAnimationFrame(tick);
  };

  const request = () => {
    dirty = true;
    if (!frame) frame = requestAnimationFrame(tick);
  };

  return {
    stats,
    setTexture(data, w, h) {
      texture = { data, w, h };
      request();
    },
    setPhase(value) {
      if (value === phase) return;
      phase = value;
      request();
    },
    // The drag turn, in radians; eased.
    setTarget(lon, lat) {
      target.lon = lon;
      target.lat = lat;
      if (!frame) frame = requestAnimationFrame(tick);
    },
    setIdle(value) {
      if (idle === value) return;
      idle = value;
      lastIdleFrame = 0; // resume from where it stopped, without a jump
      if (idle && !frame) frame = requestAnimationFrame(tick);
    },
    drawNow() {
      draw();
    },
    destroy() {
      cancelAnimationFrame(frame);
      frame = 0;
      idle = false;
    },
  };
};

// Grey texture: the red channel is the luma. Read it a pixel at a time as
// 32-bit words (little-endian: red is the low byte).
export const lumaFromRgba = (rgba, pixels) => {
  const words = new Uint32Array(rgba.buffer, rgba.byteOffset, pixels);
  const luma = new Uint8Array(pixels);
  for (let i = 0; i < pixels; i++) luma[i] = words[i] & 255;
  return luma;
};

// Decoding the 1024×512 texture and reading its pixels back is one ~20ms
// task (80ms+ on a throttled phone), so it runs in a short-lived worker
// (moonTexture.worker.js). Browsers without workers or OffscreenCanvas, or
// if the worker fails, decode on this thread instead.
const decodeInWorker = (src) =>
  new Promise((resolve, reject) => {
    if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
      reject(new Error("No OffscreenCanvas worker"));
      return;
    }
    const worker = new Worker(new URL("./moonTexture.worker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = ({ data }) => {
      worker.terminate();
      if (data.error) reject(new Error(data.error));
      else resolve(data);
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(event);
    };
    worker.postMessage({ src: new URL(src, window.location.href).href });
  });

const decodeOnMainThread = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const cx = c.getContext("2d", { willReadFrequently: true });
      cx.drawImage(img, 0, 0);
      const rgba = cx.getImageData(0, 0, c.width, c.height).data;
      resolve({ data: lumaFromRgba(rgba, c.width * c.height), w: c.width, h: c.height });
    };
    img.onerror = reject;
    img.src = src;
  });

// Decode an equirectangular texture to a luma array: { data, w, h }.
export const loadMoonTexture = (src) =>
  decodeInWorker(src).catch(() => decodeOnMainThread(src));

// ---- Twinkling stars on the star canvas ----
//
// Six stars that slowly brighten and fade (what .twinkle used to do in CSS),
// drawn onto the star canvas: normally the OffscreenCanvas inside the sky
// worker, so twinkling costs the main thread nothing (six CSS animations
// cost it ~3% at 4x CPU, and each counted in document.getAnimations()).
// Each frame restores only the few small squares it drew last time from the
// star layer, then redraws the six dots. At most 20fps: a 4-5s fade needs no
// more. Desktop only, never with reduced motion (the page decides).

export const TWINKLES = [
  { x: 0.22, y: 0.14, dur: 3.6, delay: 0.4 },
  { x: 0.58, y: 0.22, dur: 4.8, delay: 1.9 },
  { x: 0.12, y: 0.41, dur: 4.2, delay: 0.9 },
  { x: 0.47, y: 0.63, dur: 5.4, delay: 2.6 },
  { x: 0.81, y: 0.78, dur: 3.9, delay: 1.2 },
  { x: 0.28, y: 0.86, dur: 5, delay: 3.1 },
];

const FRAME_MS = 1000 / 20;
const FRAME_SLACK_MS = 4;
// --sky-tint (204 100% 88%) as rgb.
const TINT = "194, 230, 255";
// As the CSS did: opacity 0.15 → 0.9 and scale 1 → 1.4, eased, alternating.
const LOW = 0.15;
const HIGH = 0.9;
const GROW = 0.4;
const DOT_PX = 1; // radius
const GLOW_PX = 5; // radius of the soft halo at full size
const BOX_PX = Math.ceil((GLOW_PX * (1 + GROW) + 1) * 2);

const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

export const createTwinkles = ({
  canvas,
  starLayer,
  raf = (cb) => requestAnimationFrame(cb),
  caf = (id) => cancelAnimationFrame(id),
}) => {
  const ctx = canvas.getContext("2d");
  let running = false;
  let frame = 0;
  let lastFrame = 0;
  let origin = 0;
  let pausedAt = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let spots = [];

  const restore = ({ x, y }) => {
    const x0 = Math.max(0, Math.floor(x - BOX_PX / 2));
    const y0 = Math.max(0, Math.floor(y - BOX_PX / 2));
    const x1 = Math.min(width, x0 + BOX_PX);
    const y1 = Math.min(height, y0 + BOX_PX);
    if (x1 <= x0 || y1 <= y0) return;
    ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
    ctx.drawImage(starLayer, x0 * dpr, y0 * dpr, (x1 - x0) * dpr, (y1 - y0) * dpr, x0, y0, x1 - x0, y1 - y0);
  };

  const draw = (spot, now) => {
    const t = ((now - origin) / 1000 - spot.delay) / spot.dur;
    // Before its delay a star rests at the low end, as the CSS did.
    const cycle = t < 0 ? 0 : t % 2;
    const e = ease(cycle < 1 ? cycle : 2 - cycle);
    const alpha = LOW + (HIGH - LOW) * e;
    const scale = 1 + GROW * e;
    const glow = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, GLOW_PX * scale);
    glow.addColorStop(0, `rgba(${TINT}, ${(alpha * 0.9).toFixed(3)})`);
    glow.addColorStop(1, `rgba(${TINT}, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, GLOW_PX * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${TINT}, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, DOT_PX * scale, 0, Math.PI * 2);
    ctx.fill();
  };

  const tick = (now) => {
    frame = 0;
    if (!running) return;
    if (now - lastFrame >= FRAME_MS - FRAME_SLACK_MS) {
      lastFrame = now;
      spots.forEach((spot) => {
        restore(spot);
        draw(spot, now);
      });
    }
    frame = raf(tick);
  };

  return {
    // Pausing holds the current frame; resuming carries on from it.
    start() {
      if (running || !width) return;
      running = true;
      // Time spent paused does not count: no jump on resume.
      if (pausedAt) origin += performance.now() - pausedAt;
      pausedAt = 0;
      frame = raf(tick);
    },
    stop() {
      if (running) pausedAt = performance.now();
      running = false;
      caf(frame);
      frame = 0;
    },
    // Whenever the star layer is (re)painted, in CSS px and device ratio. The
    // stars are placed over the top viewport-height of the canvas.
    resize(size) {
      ({ width, height, dpr } = size);
      const viewport = size.viewportHeight ?? height;
      spots = TWINKLES.map((t) => ({ ...t, x: t.x * width, y: t.y * viewport }));
      if (!origin) origin = performance.now();
    },
  };
};

// ---- The star field ----
//
// Pure drawing, shared by the main thread and the sky worker. The layout is
// seeded, so every redraw (resize) paints the same sky.

const SEED = 369;
const AREA_PER_STAR = 9000; // px² of viewport per star
const MAX_STARS = 220;

// Mostly cool moonlight, a few blue-white, the odd warm one.
const TINTS = [
  [226, 233, 245],
  [226, 233, 245],
  [226, 233, 245],
  [180, 204, 236],
  [244, 222, 190],
];

// Small, fast, deterministic PRNG (mulberry32).
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const MAX_DPR = 2;

// Size `layer` and `canvas` to width × height CSS px at `dpr`, draw the stars
// into `layer`, then copy them onto `canvas`. Works for <canvas> and
// OffscreenCanvas alike.
export const paintStarfield = ({ canvas, layer, width, height, dpr }) => {
  for (const target of [canvas, layer]) {
    target.width = Math.round(width * dpr);
    target.height = Math.round(height * dpr);
  }

  const ctx = layer.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const random = seeded(SEED);
  const count = Math.min(
    MAX_STARS,
    Math.round((width * height) / AREA_PER_STAR),
  );

  for (let i = 0; i < count; i++) {
    const x = random() * width;
    const y = random() * height;
    // Skewed towards tiny: most stars are specks, a handful are brighter.
    const size = random() ** 3;
    const radius = 0.35 + size * 1.15;
    const alpha = 0.18 + size * 0.5 + random() * 0.12;
    const [r, g, b] = TINTS[Math.floor(random() * TINTS.length)];

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const visible = canvas.getContext("2d");
  visible.setTransform(dpr, 0, 0, dpr, 0, 0);
  visible.drawImage(layer, 0, 0, width, height);
};

import { useEffect, useRef } from "react";

// A sparse, mostly static star field on one <canvas>, drawn once.
//
// There is no animation loop. On desktop the canvas drifts very slowly with
// scroll through a CSS scroll timeline (see .stars-canvas in index.css), which
// runs on the compositor; phones, reduced motion and browsers without scroll
// timelines get the still image. The layout is seeded, so a resize redraws the
// same sky rather than a new one.

const SEED = 369;
const MAX_DPR = 2;
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

const draw = (canvas) => {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const random = seeded(SEED);
  const count = Math.min(MAX_STARS, Math.round((width * height) / AREA_PER_STAR));

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
};

const StarBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    draw(canvas);

    // Only a width change is a real resize. Phones change height constantly
    // as the address bar shows and hides; the canvas is sized to the large
    // viewport so it never needs redrawing for that.
    let lastWidth = window.innerWidth;
    let timer = 0;
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(timer);
      timer = setTimeout(() => draw(canvas), 150);
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="stars-canvas fixed inset-x-0 top-0 w-full pointer-events-none z-0"
    />
  );
};

export default StarBackground;

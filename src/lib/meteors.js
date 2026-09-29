// ---- Meteors on the star canvas ----
//
// A fixed pool of meteor objects drawn onto the same canvas as the stars —
// normally an OffscreenCanvas inside the sky worker, so meteor frames never
// touch the main thread. Nothing touches the DOM per meteor. Each frame restores only the small
// rectangles the previous frame drew over (copied from an off-screen star
// layer), then draws the live meteors. The loop runs only while a meteor is
// alive — during the gaps between them nothing runs at all — and never faster
// than 30fps.

const FRAME_MS = 1000 / 30;
// A 60Hz display delivers frames 33.3ms apart; without a little slack every
// other eligible frame would be skipped and the cap would land on 20fps.
const FRAME_SLACK_MS = 4;

const SETTINGS = {
  desktop: {
    pool: 4,
    maxActive: 5,
    gapMs: [800, 2300],
    speed: [300, 720], // px/s
    length: [90, 170], // px
    lifeMs: [800, 1500],
    peak: [0.45, 0.7],
  },
  // Phones: at most two at once, longer gaps, a little fainter.
  phone: {
    pool: 2,
    maxActive: 2,
    gapMs: [2500, 6000],
    speed: [360, 560],
    length: [70, 120],
    lifeMs: [750, 1100],
    peak: [0.4, 0.55],
  },
};

const between = ([min, max]) => min + Math.random() * (max - min);

// `raf`/`caf` default to the global ones; the worker passes its own (with a
// timer fallback where workers have no requestAnimationFrame).
export const createMeteorShower = ({
  canvas,
  starLayer,
  phone = false,
  raf = (cb) => requestAnimationFrame(cb),
  caf = (id) => cancelAnimationFrame(id),
}) => {
  const config = phone ? SETTINGS.phone : SETTINGS.desktop;
  const ctx = canvas.getContext("2d");
  const pool = Array.from({ length: config.pool }, () => ({ alive: false }));
  let dirty = []; // rectangles drawn last frame, in CSS px
  let running = false;
  let frame = 0;
  let spawnTimer = 0;
  let lastFrame = 0;
  let dpr = 1;
  let width = 0;
  let height = 0;

  // Put the stars back under a rectangle (CSS px), clamped to the canvas.
  const restore = ({ x, y, w, h }) => {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(width, Math.ceil(x + w));
    const y1 = Math.min(height, Math.ceil(y + h));
    if (x1 <= x0 || y1 <= y0) return;
    ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
    ctx.drawImage(
      starLayer,
      x0 * dpr,
      y0 * dpr,
      (x1 - x0) * dpr,
      (y1 - y0) * dpr,
      x0,
      y0,
      x1 - x0,
      y1 - y0,
    );
  };

  const spawn = (now) => {
    const active = pool.filter((m) => m.alive).length;
    const meteor = pool.find((m) => !m.alive);
    if (!meteor || active >= config.maxActive) return;
    // Enter from the upper right and travel down-left, a little off 145°.
    const angle = ((145 + (Math.random() - 0.5) * 16) * Math.PI) / 180;
    Object.assign(meteor, {
      alive: true,
      born: now,
      x: width * (0.4 + Math.random() * 0.65),
      y: height * (-0.05 + Math.random() * 0.45),
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      speed: between(config.speed),
      length: between(config.length),
      life: between(config.lifeMs),
      peak: between(config.peak),
    });
  };

  // Quick fade in, hold, longer fade out.
  const envelope = (t) => (t < 0.15 ? t / 0.15 : t > 0.65 ? (1 - t) / 0.35 : 1);

  const drawMeteor = (m, now) => {
    const age = now - m.born;
    const t = age / m.life;
    if (t >= 1) {
      m.alive = false;
      return null;
    }
    const alpha = m.peak * envelope(t);
    const travelled = (m.speed * age) / 1000;
    const hx = m.x + m.dx * travelled;
    const hy = m.y + m.dy * travelled;
    // The tail grows in over the first part of the flight.
    const tail = m.length * Math.min(1, t * 3);
    const tx = hx - m.dx * tail;
    const ty = hy - m.dy * tail;

    // Long soft fade along the tail, a short one right at the head.
    const gradient = ctx.createLinearGradient(tx, ty, hx, hy);
    gradient.addColorStop(0, "rgba(200, 225, 255, 0)");
    gradient.addColorStop(0.7, `rgba(210, 232, 255, ${(alpha * 0.45).toFixed(3)})`);
    gradient.addColorStop(0.96, `rgba(236, 245, 255, ${alpha.toFixed(3)})`);
    gradient.addColorStop(1, `rgba(236, 245, 255, ${(alpha * 0.5).toFixed(3)})`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    // A tiny soft head.
    ctx.fillStyle = `rgba(236, 245, 255, ${(alpha * 0.35).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(hx, hy, 2.2, 0, Math.PI * 2);
    ctx.fill();

    const pad = 4;
    return {
      x: Math.min(tx, hx) - pad,
      y: Math.min(ty, hy) - pad,
      w: Math.abs(hx - tx) + pad * 2,
      h: Math.abs(hy - ty) + pad * 2,
    };
  };

  const tick = (now) => {
    frame = 0;
    if (!running) return;
    if (now - lastFrame < FRAME_MS - FRAME_SLACK_MS) {
      frame = raf(tick);
      return;
    }
    lastFrame = now;

    dirty.forEach(restore);
    dirty = [];
    pool.forEach((m) => {
      if (!m.alive) return;
      const rect = drawMeteor(m, now);
      if (rect) dirty.push(rect);
    });

    // Keep going only while something is in flight.
    if (pool.some((m) => m.alive)) frame = raf(tick);
    else {
      dirty.forEach(restore);
      dirty = [];
    }
  };

  const scheduleSpawn = () => {
    clearTimeout(spawnTimer);
    spawnTimer = setTimeout(() => {
      if (!running) return;
      spawn(performance.now());
      if (!frame) frame = raf(tick);
      scheduleSpawn();
    }, between(config.gapMs));
  };

  return {
    start() {
      if (running || !width) return;
      running = true;
      scheduleSpawn();
    },
    stop() {
      running = false;
      clearTimeout(spawnTimer);
      caf(frame);
      frame = 0;
      // Wipe anything half-drawn and forget the flights.
      dirty.forEach(restore);
      dirty = [];
      pool.forEach((m) => (m.alive = false));
    },
    // Whenever the star layer is (re)painted, in CSS px and device ratio.
    resize(size) {
      ({ width, height, dpr } = size);
      dirty = [];
      pool.forEach((m) => (m.alive = false));
    },
  };
};

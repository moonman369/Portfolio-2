import { TWINKLES } from "../lib/twinkles";

// A few twinkling stars over the dark background, in CSS (opacity/transform
// keyframes; see .sky in index.css). Only where the star canvas cannot move
// to a worker: otherwise the same stars twinkle on the canvas, in the worker
// (lib/twinkles.js), which costs the main thread nothing. Desktop only.

const SkyMotion = () => (
  <div
    aria-hidden="true"
    className="sky fixed inset-0 overflow-hidden pointer-events-none z-0 max-md:hidden"
  >
    {TWINKLES.map((t) => (
      <span
        key={`${t.x}-${t.y}`}
        className="twinkle"
        style={{
          top: `${t.y * 100}%`,
          left: `${t.x * 100}%`,
          "--dur": `${t.dur}s`,
          "--delay": `${t.delay}s`,
        }}
      />
    ))}
  </div>
);

export default SkyMotion;

// A few twinkling stars over the dark background. Pure CSS (opacity/transform
// keyframes), so it costs the main thread nothing; see .sky in index.css.
// Desktop only; the meteors live on the star canvas (lib/meteors.js).
const TWINKLES = [
  { top: "14%", left: "22%", dur: 3.6, delay: 0.4 },
  { top: "22%", left: "58%", dur: 4.8, delay: 1.9 },
  { top: "41%", left: "12%", dur: 4.2, delay: 0.9 },
  { top: "63%", left: "47%", dur: 5.4, delay: 2.6 },
  { top: "78%", left: "81%", dur: 3.9, delay: 1.2 },
  { top: "86%", left: "28%", dur: 5, delay: 3.1 },
];

const SkyMotion = () => (
  <div
    aria-hidden="true"
    className="sky fixed inset-0 overflow-hidden pointer-events-none z-0 max-md:hidden"
  >
    {TWINKLES.map((t) => (
      <span
        key={`${t.top}-${t.left}`}
        className="twinkle"
        style={{
          top: t.top,
          left: t.left,
          "--dur": `${t.dur}s`,
          "--delay": `${t.delay}s`,
        }}
      />
    ))}
  </div>
);

export default SkyMotion;

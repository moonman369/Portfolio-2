import { cn } from "../lib/utils";

// Meteors and a few twinkling stars over the background. Pure CSS
// (transform/opacity keyframes), so it costs the main thread nothing; see
// .sky in index.css. Phones get two meteors and no twinkles.
const METEORS = [
  { top: "10%", left: "70%", len: 160, dur: 11, delay: 1.5 },
  { top: "34%", left: "96%", len: 120, dur: 14, delay: 6.5 },
  { top: "6%", left: "38%", len: 140, dur: 17, delay: 10, desktop: true },
  { top: "52%", left: "84%", len: 110, dur: 19, delay: 3.5, desktop: true },
];

const TWINKLES = [
  { top: "14%", left: "22%", dur: 3.6, delay: 0.4 },
  { top: "22%", left: "58%", dur: 4.8, delay: 1.9 },
  { top: "41%", left: "12%", dur: 4.2, delay: 0.9 },
  { top: "63%", left: "47%", dur: 5.4, delay: 2.6 },
  { top: "78%", left: "81%", dur: 3.9, delay: 1.2 },
  { top: "86%", left: "28%", dur: 5, delay: 3.1 },
];

const SkyMotion = ({ twinkles = true }) => (
  <div
    aria-hidden="true"
    className="sky fixed inset-0 overflow-hidden pointer-events-none z-0"
  >
    {METEORS.map((m) => (
      <span
        key={`${m.top}-${m.left}`}
        className={cn("meteor", m.desktop && "max-md:hidden")}
        style={{
          top: m.top,
          left: m.left,
          "--len": `${m.len}px`,
          "--dur": `${m.dur}s`,
          "--delay": `${m.delay}s`,
        }}
      />
    ))}
    {twinkles &&
      TWINKLES.map((t) => (
        <span
          key={`${t.top}-${t.left}`}
          className="twinkle max-md:hidden"
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

import { useId } from "react";
import { cn } from "../lib/utils";
import { shadowPath, terminatorPath } from "../lib/moonPhase";

// The hero's signature: a large thin-line moon in the style of an engraved
// plate — limb, terminator, a few crater arcs, a hatched night side and one
// orbit. HeroSection draws it once on load with createDrawable; without motion
// it simply renders fully drawn.
const CX = 240;
const CY = 240;
const R = 150;
const PHASE = 0.62; // waxing gibbous

// Crater arcs on the lit side: [cx, cy, rx, ry, sweep of the drawn arc].
// Craters near the limb are foreshortened (narrower rx).
const CRATERS = [
  [300, 168, 22, 22, 300],
  [338, 258, 11, 16, 360],
  [268, 298, 10, 10, 280],
  [292, 124, 6, 6, 360],
  [356, 198, 4, 6, 360],
];

const arc = ([cx, cy, rx, ry, degrees]) => {
  // Start at the left of the ellipse and sweep clockwise by `degrees`.
  const end = ((180 + degrees) * Math.PI) / 180;
  const x = cx + rx * Math.cos(end);
  const y = cy + ry * Math.sin(end);
  if (degrees >= 360) {
    return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`;
  }
  return `M${cx - rx} ${cy}A${rx} ${ry} 0 ${degrees > 180 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
};

// One orbit, tilted, split so the back half passes behind the disc.
const ORBIT = { rx: 222, ry: 58, tilt: -16 };
const orbitBack = `M${CX - ORBIT.rx} ${CY}A${ORBIT.rx} ${ORBIT.ry} 0 0 1 ${CX + ORBIT.rx} ${CY}`;
const orbitFront = `M${CX + ORBIT.rx} ${CY}A${ORBIT.rx} ${ORBIT.ry} 0 0 1 ${CX - ORBIT.rx} ${CY}`;

// Compass ticks just outside the limb.
const TICKS = [0, 90, 180, 270].map((deg) => {
  const a = (deg * Math.PI) / 180;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return `M${CX + c * (R + 14)} ${CY + s * (R + 14)}L${CX + c * (R + 26)} ${CY + s * (R + 26)}`;
});

const limb = `M${CX} ${CY - R}A${R} ${R} 0 0 1 ${CX} ${CY + R}A${R} ${R} 0 0 1 ${CX} ${CY - R}`;

const HeroMoon = ({ className }) => {
  const hatchId = `moon-hatch-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("hero-moon text-primary", className)}
    >
      <defs>
        <pattern
          id={hatchId}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(38)"
        >
          <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>

      <g transform={`rotate(${ORBIT.tilt} ${CX} ${CY})`}>
        <path data-draw d={orbitBack} className="hero-moon-line opacity-45" />
      </g>

      {/* The disc occludes the back of the orbit. */}
      <circle cx={CX} cy={CY} r={R} className="fill-background" />
      <path
        data-shade
        d={shadowPath(PHASE, CX, CY, R)}
        fill={`url(#${hatchId})`}
        className="opacity-30"
      />

      <path data-draw d={limb} className="hero-moon-line" />
      <path
        data-draw
        d={terminatorPath(PHASE, CX, CY, R)}
        className="hero-moon-line opacity-80"
      />
      {CRATERS.map((crater) => (
        <path
          key={crater.join("-")}
          data-draw
          d={arc(crater)}
          className="hero-moon-line opacity-70"
        />
      ))}
      {TICKS.map((d) => (
        <path key={d} data-draw d={d} className="hero-moon-line opacity-60" />
      ))}

      <g transform={`rotate(${ORBIT.tilt} ${CX} ${CY})`}>
        <path data-draw d={orbitFront} className="hero-moon-line opacity-70" />
        {/* A small satellite riding the near side of the orbit. */}
        <circle
          data-satellite
          cx={CX - ORBIT.rx * 0.62}
          cy={CY + ORBIT.ry * Math.sqrt(1 - 0.62 ** 2)}
          r="4.5"
          className="fill-primary"
        />
      </g>
    </svg>
  );
};

export default HeroMoon;

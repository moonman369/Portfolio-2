import { cn } from "../lib/utils";
import {
  CX,
  CY,
  ORBIT,
  R,
  SATELLITE_REST,
  satellitePoint,
} from "../lib/heroMoonGeometry";

// The hero moon as a lit sphere. Three layers share the 480 × 480 geometry:
//
//   back   the far half of the orbit and the satellite's far-side twin
//   disc   a <canvas> the controller lights and textures (lib/moonSphere.js),
//          on a flat placeholder circle until the first frame, with an
//          accent rim glow and a theme-matched halo / cast shadow
//   front  the near half of the orbit, compass ticks and the satellite
//
// The entrance draws the lines ([data-draw]) and fades the disc in
// ([data-moon-disc]). Decorative: the controller around it is the slider.

const orbitBack = `M${CX - ORBIT.rx} ${CY}A${ORBIT.rx} ${ORBIT.ry} 0 0 1 ${CX + ORBIT.rx} ${CY}`;
const orbitFront = `M${CX + ORBIT.rx} ${CY}A${ORBIT.rx} ${ORBIT.ry} 0 0 1 ${CX - ORBIT.rx} ${CY}`;
const TICKS = [0, 90, 180, 270].map((deg) => {
  const a = (deg * Math.PI) / 180;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return `M${CX + c * (R + 14)} ${CY + s * (R + 14)}L${CX + c * (R + 26)} ${CY + s * (R + 26)}`;
});
const SATELLITE = satellitePoint(SATELLITE_REST);
const orbitTilt = `rotate(${ORBIT.tilt} ${CX} ${CY})`;

// The disc's box as a share of the 480 viewBox.
const DISC_INSET = `${((CX - R) / 480) * 100}%`;
const DISC_SIZE = `${((2 * R) / 480) * 100}%`;

const Layer = ({ children }) => (
  <svg
    viewBox="0 0 480 480"
    fill="none"
    aria-hidden="true"
    focusable="false"
    className="absolute inset-0 h-full w-full overflow-visible"
  >
    {children}
  </svg>
);

const HeroMoon3D = ({ className }) => (
  <div
    aria-hidden="true"
    className={cn("hero-moon moon3d relative aspect-square text-primary", className)}
  >
    <Layer>
      <g transform={orbitTilt}>
        <path data-draw data-glow d={orbitBack} className="hero-moon-line opacity-45" />
        <circle
          data-sat-back
          cx={SATELLITE.x}
          cy={SATELLITE.y}
          r="4.5"
          opacity="0"
          className="fill-primary"
        />
      </g>
    </Layer>

    <div
      data-moon-disc
      className="moon3d-disc absolute rounded-full"
      style={{ left: DISC_INSET, top: DISC_INSET, width: DISC_SIZE, height: DISC_SIZE }}
    >
      <canvas aria-hidden="true" className="absolute inset-0 h-full w-full rounded-full" />
    </div>

    <Layer>
      {TICKS.map((d) => (
        <path key={d} data-draw d={d} className="hero-moon-line opacity-60" />
      ))}
      <g transform={orbitTilt}>
        <path data-draw data-glow d={orbitFront} className="hero-moon-line opacity-70" />
        <circle
          data-satellite
          data-sat-front
          cx={SATELLITE.x}
          cy={SATELLITE.y}
          r="4.5"
          className="fill-primary"
        />
      </g>
    </Layer>
  </div>
);

export default HeroMoon3D;

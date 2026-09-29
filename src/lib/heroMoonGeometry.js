// ---- Hero moon geometry ----
//
// Shared by the drawing (HeroMoon) and its controller (HeroMoonControl).
// Everything is in the SVG's 480 × 480 viewBox.

export const CX = 240;
export const CY = 240;
export const R = 150;

// The phase the hero rests at: a waxing gibbous.
export const REST_PHASE = 0.62;

// One tilted orbit.
export const ORBIT = { rx: 222, ry: 58, tilt: -16 };

// Where the satellite rests on the near side of the orbit, as an angle on the
// (untilted) ellipse: x = CX + rx·cos θ, y = CY + ry·sin θ.
export const SATELLITE_REST = Math.acos(-0.62);

export const satellitePoint = (theta) => ({
  x: CX + ORBIT.rx * Math.cos(theta),
  y: CY + ORBIT.ry * Math.sin(theta),
  // The half of the orbit with sin θ > 0 passes in front of the disc.
  front: Math.sin(theta) > 0,
});

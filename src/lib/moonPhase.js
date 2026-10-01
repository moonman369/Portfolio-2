// ---- Moon phase geometry ----
//
// The lit part of a waxing moon as one closed SVG path: the right-hand limb
// from top to bottom, then the terminator back up. `phase` runs from 0 (new
// moon, zero area) through 0.5 (first quarter) to 1 (full).

const clamp01 = (value) => Math.min(1, Math.max(0, value));

export const moonPhasePath = (phase, cx = 12, cy = 12, r = 10) => {
  const p = clamp01(Number.isFinite(phase) ? phase : 0);
  // The terminator is half an ellipse whose width shrinks to zero at the
  // quarter and grows back; before the quarter it bulges towards the limb
  // (crescent), after it the other way (gibbous).
  const rx = (Math.abs(1 - 2 * p) * r).toFixed(3);
  const sweep = p < 0.5 ? 0 : 1;
  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;
  return `M${top}A${r} ${r} 0 0 1 ${bottom}A${rx} ${r} 0 0 ${sweep} ${top}Z`;
};

// The terminator on its own, top to bottom, for line drawings.
export const terminatorPath = (phase, cx, cy, r) => {
  const p = clamp01(phase);
  const rx = (Math.abs(1 - 2 * p) * r).toFixed(3);
  // Top to bottom through the left of centre (gibbous) or the right (crescent).
  const sweep = p < 0.5 ? 1 : 0;
  return `M${cx} ${cy - r}A${rx} ${r} 0 0 ${sweep} ${cx} ${cy + r}`;
};

// The unlit side (left of the terminator), for the hatched shade.
export const shadowPath = (phase, cx, cy, r) => {
  const p = clamp01(phase);
  const rx = (Math.abs(1 - 2 * p) * r).toFixed(3);
  const sweep = p < 0.5 ? 0 : 1;
  return (
    `M${cx} ${cy - r}A${r} ${r} 0 0 0 ${cx} ${cy + r}` +
    `A${rx} ${r} 0 0 ${sweep} ${cx} ${cy - r}Z`
  );
};

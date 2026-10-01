// ---- Today's moon, from the date alone ----
//
// The synodic method: days since a known new moon (2000-01-06 18:14 UTC),
// modulo the mean synodic month. Good to within about a day, which is all a
// phase name and a rounded percentage need. No API, no dependency.
//
// Positions are "cycle" values: 0 new → 0.25 first quarter → 0.5 full →
// 0.75 last quarter → 1 new again.

export const SYNODIC_DAYS = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 86_400_000;

export const lunarCycle = (date = new Date()) => {
  const days = (date.getTime() - KNOWN_NEW_MOON) / DAY_MS;
  const age = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  return age / SYNODIC_DAYS;
};

// Share of the disc that is lit, 0..1.
export const illuminatedFraction = (cycle) => (1 - Math.cos(2 * Math.PI * cycle)) / 2;

// Which of the eight named phases a cycle position falls in (0 new … 7
// waning crescent); each name covers an eighth of the cycle, centred on it.
export const phaseIndex = (cycle) => Math.floor(cycle * 8 + 0.5) % 8;

// Fill a caption template ("{phase}", "{lit}").
export const fillCaption = (template, values) =>
  template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);

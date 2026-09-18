// Exercises src/lib/countUp.js — the easing, quantize and retarget rules
// behind the animated stats.
//
//   node scripts/test-count-up.mjs
//
// Plain Node + node:assert: no test runner, no new dependency. Not in CI.

import assert from "node:assert/strict";
import {
  easeOutCubic,
  frameValue,
  isCountable,
  planAnimation,
  RETARGET_DURATION_MS,
} from "../src/lib/countUp.js";

const results = [];
const test = (name, fn) => {
  try {
    fn();
    results.push({ ok: true, name });
  } catch (err) {
    results.push({ ok: false, name, message: err.message });
  }
};

// Walk an animation the way rAF would, at a fixed frame budget.
const runFrames = ({ from = 0, to, duration, quantize = 1, stepMs = 16 }) => {
  const seen = [];
  for (let elapsed = 0; elapsed <= duration + stepMs; elapsed += stepMs) {
    seen.push(frameValue({ from, to, elapsed, duration, quantize }));
  }
  return seen;
};

test("easeOutCubic is anchored at both ends and decelerates", () => {
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.ok(easeOutCubic(0.5) > 0.5, "should be ahead of linear at the middle");
  const first = easeOutCubic(0.1) - easeOutCubic(0);
  const last = easeOutCubic(1) - easeOutCubic(0.9);
  assert.ok(first > last, "should slow down towards the end");
});

test("a count starts at zero, rises monotonically, and lands exactly", () => {
  const frames = runFrames({ to: 1234, duration: 1200 });
  assert.equal(frames[0], 0);
  assert.equal(frames.at(-1), 1234, "must land on the exact value");
  for (let i = 1; i < frames.length; i += 1) {
    assert.ok(frames[i] >= frames[i - 1], "must never go backwards");
    assert.ok(frames[i] <= 1234, "must never overshoot");
  }
  assert.ok(frames.every(Number.isInteger), "integers only");
});

test("duration is clock-driven, so magnitude does not change the timing", () => {
  const small = runFrames({ to: 12, duration: 1200 });
  const huge = runFrames({ to: 1_250_000, duration: 1200 });
  assert.equal(small.length, huge.length, "same number of frames");
  // Both should be at the same fraction of their target at the same instant.
  const at = (frames, target) => frames[Math.floor(frames.length / 2)] / target;
  assert.ok(Math.abs(at(small, 12) - at(huge, 1_250_000)) < 0.05);
});

test("quantize steps the number down while running, exact on the last frame", () => {
  const frames = runFrames({ to: 146_323, duration: 900, quantize: 500 });
  const running = frames.slice(0, -1);
  assert.ok(
    running.every((v) => v % 500 === 0),
    "every intermediate frame should be a multiple of 500",
  );
  assert.equal(frames.at(-1), 146_323, "final frame ignores quantize");
  assert.ok(new Set(running).size > 5, "should visibly step, not sit still");
  assert.ok(running.every((v) => v <= 146_323), "rounds down, never past the target");
});

test("quantize of 100 or 1000 works the same way", () => {
  [100, 1000].forEach((step) => {
    const frames = runFrames({ to: 146_323, duration: 900, quantize: step });
    assert.ok(frames.slice(0, -1).every((v) => v % step === 0), `step ${step}`);
    assert.equal(frames.at(-1), 146_323);
  });
});

test("a target of null, undefined or NaN animates nothing", () => {
  assert.equal(isCountable(null), false);
  assert.equal(isCountable(undefined), false);
  assert.equal(isCountable(NaN), false);
  assert.equal(isCountable("512"), false);
  assert.equal(isCountable(0), true);
  [null, undefined, NaN].forEach((to) => {
    assert.equal(frameValue({ from: 0, to, elapsed: 10, duration: 1200 }), null);
  });
});

test("a first run counts from zero over the full duration", () => {
  const plan = planAnimation({ previous: null, to: 900, now: 1000, duration: 1200 });
  assert.deepEqual(plan, { from: 0, to: 900, start: 1000, duration: 1200 });
});

test("retarget mid-flight carries on from the displayed value", () => {
  const first = planAnimation({ previous: null, to: 500, now: 0, duration: 1200 });
  first.current = 210; // what the screen shows 600ms in
  const next = planAnimation({ previous: first, to: 640, now: 600, duration: 1200 });
  assert.equal(next.from, 210, "must continue from the screen, not from zero");
  assert.equal(next.to, 640);
  assert.equal(next.duration, 600, "600ms was left on the clock, so use it");
  const frames = runFrames({ from: next.from, to: next.to, duration: next.duration });
  assert.equal(frames[0], 210, "no jump back to zero");
  assert.equal(frames.at(-1), 640);
});

test("a long remaining leg keeps its own clock rather than snapping to 400ms", () => {
  const first = planAnimation({ previous: null, to: 500, now: 0, duration: 1200 });
  first.current = 40;
  const next = planAnimation({ previous: first, to: 900, now: 100, duration: 1200 });
  assert.equal(next.duration, 1100, "1100ms was left, so use it");
  assert.equal(next.from, 40);
});

test("retarget after the animation finished lands over ~400ms", () => {
  const first = planAnimation({ previous: null, to: 500, now: 0, duration: 1200 });
  first.current = 500;
  const next = planAnimation({ previous: first, to: 512, now: 5000, duration: 1200 });
  assert.equal(next.from, 500);
  assert.equal(next.duration, RETARGET_DURATION_MS);
});

test("a downward retarget is smooth and never overshoots", () => {
  const first = planAnimation({ previous: null, to: 900, now: 0, duration: 1200 });
  first.current = 700;
  const next = planAnimation({ previous: first, to: 640, now: 900, duration: 1200 });
  const frames = runFrames({ from: next.from, to: next.to, duration: next.duration });
  assert.equal(frames[0], 700);
  assert.equal(frames.at(-1), 640);
  for (let i = 1; i < frames.length; i += 1) {
    assert.ok(frames[i] <= frames[i - 1], "must fall monotonically");
    assert.ok(frames[i] >= 640, "must not undershoot");
  }
});

test("an explicit replay restarts from zero", () => {
  const previous = { from: 0, to: 512, start: 0, duration: 1200, current: 512 };
  const plan = planAnimation({ previous, to: 512, now: 9000, duration: 1200, replay: true });
  assert.deepEqual(plan, { from: 0, to: 512, start: 9000, duration: 1200 });
});

test("a retarget before the first frame ran still starts from zero", () => {
  const previous = planAnimation({ previous: null, to: 500, now: 0, duration: 1200 });
  // No tick has happened, so `current` is undefined.
  const next = planAnimation({ previous, to: 640, now: 30, duration: 1200 });
  assert.equal(next.from, 0, "must not produce NaN");
  const frames = runFrames({ from: next.from, to: next.to, duration: next.duration });
  assert.ok(frames.every(Number.isInteger), "no NaN frames");
  assert.equal(frames.at(-1), 640);
});

test("zero targets and zero-length durations degrade safely", () => {
  assert.equal(frameValue({ from: 0, to: 0, elapsed: 0, duration: 1200 }), 0);
  assert.equal(frameValue({ from: 0, to: 640, elapsed: 0, duration: 0 }), 640);
  assert.equal(frameValue({ from: 0, to: 640, elapsed: -50, duration: 1200 }), 0);
});

const failed = results.filter((r) => !r.ok);
results.forEach((r) =>
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `\n      ${r.message}`}`),
);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

// Exercises src/lib/moonmindSteps.js against the real captured traces from the
// backend reference, plus the edge cases we must never crash on.
//
//   node scripts/test-moonmind-steps.mjs
//
// Plain Node + node:assert on purpose: the repo has no test runner and this
// adds no dependency. Not wired into CI.

import assert from "node:assert/strict";
import {
  buildStepRows,
  formatRowDuration,
  headerLabel,
  labelForNode,
  labelForTool,
  normalizeSteps,
  runDurationSeconds,
} from "../src/lib/moonmindSteps.js";

const T0 = Date.parse("2026-09-17T10:00:00.000Z");
const at = (ms) => new Date(T0 + ms).toISOString();

// step(seq, node, type, offsetMs, summary)
const step = (seq, node, type, offsetMs, summary = "") => ({
  seq,
  node,
  type,
  ts: at(offsetMs),
  summary,
});

// ---- The real traces (captured 2026-09-17) ----

// knowledge, 11.5s
const KNOWLEDGE = [
  step(1, "router", "start", 0),
  step(2, "router", "end", 900, "route=knowledge confidence=0.90 slots=cancelsActiveFlow"),
  step(3, "knowledge", "start", 950),
  step(4, "knowledge.prepare", "start", 1000),
  step(5, "knowledge.prepare", "end", 1400),
  step(6, "knowledge.retrieve", "start", 1450),
  step(7, "knowledge.retrieve", "end", 4300, "documents=15"),
  step(8, "knowledge.to_state", "start", 4350),
  step(9, "knowledge.to_state", "end", 4500, "documents=15"),
  step(10, "knowledge", "end", 4550, "documents=15"),
  step(11, "generate", "start", 4600),
  step(12, "generate", "end", 11500, "answer=1212 chars"),
];

// agent with a web search, 8.0s
const AGENT_WEB = [
  step(1, "router", "start", 0),
  step(2, "router", "end", 800, "route=agent confidence=0.90 slots=cancelsActiveFlow"),
  step(3, "agent", "start", 850),
  step(4, "agent.scope_check", "start", 900),
  step(5, "agent.scope_check", "end", 1300),
  step(6, "agent", "tool", 3900, "web_search -> 5 results"),
  step(7, "agent", "end", 6000, "candidates=5 answer=1990 chars"),
  step(8, "generate", "start", 6050),
  step(9, "generate", "end", 8000),
];

// stats, 8.4s
const STATS = [
  step(1, "router", "start", 0),
  step(2, "router", "end", 800, "route=stats confidence=0.90 slots=which,withDocuments,cancelsActiveFlow"),
  step(3, "stats", "start", 850),
  step(4, "stats", "end", 5200, "documents=15 stats=requested+github"),
  step(5, "generate", "start", 5250),
  step(6, "generate", "end", 8400, "answer=1069 chars"),
];

// greeting, 1.6s — the shortest run, and the empty-summary case
const GREETING = [
  step(1, "router", "start", 0),
  step(2, "router", "end", 500, "route=greeting confidence=1.00 slots=cancelsActiveFlow"),
  step(3, "greeting", "start", 550),
  step(4, "greeting", "end", 900, "answer=85 chars"),
  step(5, "generate", "start", 950),
  step(6, "generate", "end", 1600),
];

// Out-of-scope agent run: stops after scope_check, no tool step, zero documents
const AGENT_OUT_OF_SCOPE = [
  step(1, "router", "start", 0),
  step(2, "router", "end", 800, "route=agent confidence=0.90 slots=cancelsActiveFlow"),
  step(3, "agent", "start", 850),
  step(4, "agent.scope_check", "start", 900),
  step(5, "agent.scope_check", "end", 1200),
  step(6, "agent", "end", 1250, "answer=180 chars"),
  step(7, "generate", "start", 1300),
  step(8, "generate", "end", 2400),
];

// capabilities, ~1s
const CAPABILITIES = [
  step(1, "router", "start", 0),
  step(2, "router", "end", 400, "route=capabilities confidence=1.00 slots=cancelsActiveFlow"),
  step(3, "capabilities", "start", 430),
  step(4, "capabilities", "end", 700, "answer=310 chars"),
  step(5, "generate", "start", 730),
  step(6, "generate", "end", 1050),
];

const results = [];
const test = (name, fn) => {
  try {
    fn();
    results.push({ ok: true, name });
  } catch (err) {
    results.push({ ok: false, name, message: err.message });
  }
};

const rowFor = (rows, node) => rows.find((r) => r.node === node && r.kind === "node");

// ---- Checks ----

test("greeting: panel content, empty generate summary reads as done", () => {
  const rows = buildStepRows(GREETING, { finished: true });
  assert.deepEqual(rows.map((r) => r.node), ["router", "greeting", "generate"]);
  assert.ok(rows.every((r) => r.state === "done"), "every row should be done");
  const generate = rowFor(rows, "generate");
  assert.equal(generate.summary, "", "empty summary is expected here");
  assert.equal(generate.state, "done", "empty summary must not read as a failure");
  assert.equal(headerLabel({ rows, steps: GREETING }), "Thought for 2s");
});

test("knowledge: sub-steps nest under the branch, never as peers", () => {
  const rows = buildStepRows(KNOWLEDGE, { finished: true });
  assert.equal(rowFor(rows, "knowledge").depth, 0);
  assert.equal(rowFor(rows, "knowledge").label, "Searching Ayan's portfolio");
  ["knowledge.prepare", "knowledge.retrieve", "knowledge.to_state"].forEach((node) => {
    assert.equal(rowFor(rows, node).depth, 1, `${node} must be indented`);
  });
  assert.deepEqual(
    ["knowledge.prepare", "knowledge.retrieve", "knowledge.to_state"].map((n) => rowFor(rows, n).label),
    ["Preparing the search", "Retrieving documents", "Collecting results"],
  );
  assert.equal(rowFor(rows, "knowledge.retrieve").summary, "documents=15");
  assert.equal(formatRowDuration(rowFor(rows, "knowledge.retrieve").durationMs), "2.9s");
  assert.equal(headerLabel({ rows, steps: KNOWLEDGE }), "Thought for 12s");
});

test("agent: the web_search tool row sits under Researching", () => {
  const rows = buildStepRows(AGENT_WEB, { finished: true });
  const tool = rows.find((r) => r.kind === "tool");
  assert.ok(tool, "expected a tool row");
  assert.equal(tool.node, "agent");
  assert.equal(tool.label, "Searching the web");
  assert.equal(tool.depth, 1, "tool row must be a child of its branch");
  assert.equal(tool.state, "done");
  assert.equal(tool.summary, "web_search -> 5 results");
  assert.equal(rowFor(rows, "agent").label, "Researching");
  assert.equal(rowFor(rows, "agent").depth, 0);
});

test("stats: one branch row carrying the mixed summary", () => {
  const rows = buildStepRows(STATS, { finished: true });
  assert.deepEqual(rows.map((r) => r.node), ["router", "stats", "generate"]);
  assert.equal(rowFor(rows, "stats").summary, "documents=15 stats=requested+github");
  assert.equal(rowFor(rows, "stats").label, "Fetching GitHub & LeetCode stats");
});

test("an error step warns on its own row only", () => {
  const withError = KNOWLEDGE.map((s) =>
    s.seq === 7 ? { ...s, type: "error", summary: "retrieval exploded" } : s,
  );
  const rows = buildStepRows(withError, { finished: true });
  const retrieve = rowFor(rows, "knowledge.retrieve");
  assert.equal(retrieve.state, "warning");
  assert.equal(retrieve.summary, "retrieval exploded");
  assert.equal(rowFor(rows, "knowledge").state, "done", "the parent must not inherit the warning");
  assert.equal(rowFor(rows, "generate").state, "done", "the run still reaches generate");
  assert.equal(headerLabel({ rows, steps: withError }), "Thought for 12s", "no failure wording");
});

test("unknown node and unknown child fall back without crashing", () => {
  const odd = [
    step(1, "foo", "start", 0),
    step(2, "foo", "end", 500, "whatever=1"),
    step(3, "knowledge", "start", 550),
    step(4, "knowledge.bar", "start", 600),
    step(5, "knowledge.bar", "end", 900),
    step(6, "knowledge", "end", 950, "documents=2"),
    step(7, "agent", "tool", 1000, "mystery_tool -> 3 results"),
  ];
  const rows = buildStepRows(odd, { finished: true });
  assert.equal(rowFor(rows, "foo").label, "Working");
  assert.equal(rowFor(rows, "foo").depth, 0);
  assert.equal(rowFor(rows, "knowledge.bar").label, "Bar");
  assert.equal(rowFor(rows, "knowledge.bar").depth, 1, "unknown child still nests");
  assert.equal(rows.find((r) => r.kind === "tool").label, "Using a tool");
  assert.equal(labelForNode(undefined), "Working");
  assert.equal(labelForNode(""), "Working");
  assert.equal(labelForTool(undefined), "Using a tool");
  assert.equal(labelForTool("resolve_time -> 0 results"), "Working out the dates");
  assert.equal(labelForTool("semantic_search -> 8 results"), "Reading the portfolio");
  assert.equal(labelForTool("metadata_filter -> 2 results"), "Reading the portfolio");
  assert.doesNotThrow(() => buildStepRows([null, undefined, {}, { seq: "x" }, 7]));
});

test("tech_web is labelled exactly like agent", () => {
  assert.equal(labelForNode("tech_web"), labelForNode("agent"));
  assert.equal(labelForNode("tech_web"), "Researching");
});

test("duplicate seq values are ignored", () => {
  const dupes = [...GREETING, step(4, "greeting", "end", 900, "answer=999 chars")];
  assert.equal(normalizeSteps(dupes).length, GREETING.length);
  const rows = buildStepRows(dupes, { finished: true });
  assert.equal(rowFor(rows, "greeting").summary, "answer=85 chars", "first seq wins");
  assert.equal(rows.length, 3, "no duplicate rows");
});

test("out-of-order arrival is sorted by seq", () => {
  const shuffled = [
    KNOWLEDGE[6],
    KNOWLEDGE[0],
    KNOWLEDGE[11],
    ...KNOWLEDGE.slice(1, 6),
    ...KNOWLEDGE.slice(7, 11),
  ];
  const rows = buildStepRows(shuffled, { finished: true });
  assert.deepEqual(
    rows.map((r) => r.node),
    buildStepRows(KNOWLEDGE, { finished: true }).map((r) => r.node),
  );
  assert.equal(rowFor(rows, "knowledge.retrieve").state, "done");
  assert.equal(rowFor(rows, "knowledge.retrieve").summary, "documents=15");
});

test("out-of-scope agent run renders as a normal complete run", () => {
  const rows = buildStepRows(AGENT_OUT_OF_SCOPE, { finished: true });
  assert.equal(rows.filter((r) => r.kind === "tool").length, 0, "no tool row is expected");
  assert.ok(rows.every((r) => r.state === "done"), "nothing may look skipped or incomplete");
  assert.equal(headerLabel({ rows, steps: AGENT_OUT_OF_SCOPE }), "Thought for 2s");
});

test("live run headers follow the running node", () => {
  const live = (upTo) => {
    const steps = KNOWLEDGE.filter((s) => s.seq <= upTo);
    return headerLabel({ rows: buildStepRows(steps), steps, isRunning: true });
  };
  assert.equal(live(1), "Understanding your question");
  assert.equal(live(6), "Retrieving documents");
  // seq 10 closes `knowledge` with nothing else open yet, so the header holds
  // on the most recent row until `generate` starts.
  assert.equal(live(10), "Collecting results");
  assert.equal(live(11), "Writing the answer");
  assert.equal(headerLabel({ rows: [], steps: [], isRunning: true }), "Thinking…");
});

test("a finished run with no usable steps says Thought process", () => {
  assert.equal(headerLabel({ rows: [], steps: [] }), "Thought process");
  const noTimes = [{ seq: 1, node: "router", type: "start", ts: "not-a-date", summary: "" }];
  assert.equal(runDurationSeconds(noTimes), null);
  assert.equal(
    headerLabel({ rows: buildStepRows(noTimes, { finished: true }), steps: noTimes }),
    "Thought process",
  );
});

test("a ~1s run rounds up to 1s, never 0s", () => {
  assert.equal(runDurationSeconds(CAPABILITIES), 1);
  assert.equal(
    headerLabel({ rows: buildStepRows(CAPABILITIES, { finished: true }), steps: CAPABILITIES }),
    "Thought for 1s",
  );
});

test("rows still open when the run ends are closed, not left spinning", () => {
  const truncated = KNOWLEDGE.filter((s) => s.seq <= 6);
  assert.ok(buildStepRows(truncated).some((r) => r.state === "running"), "live run has a running row");
  assert.ok(
    buildStepRows(truncated, { finished: true }).every((r) => r.state !== "running"),
    "finished run has none",
  );
});

test("an end without a start still produces a row", () => {
  const rows = buildStepRows([step(1, "generate", "end", 500, "answer=10 chars")], { finished: true });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].state, "done");
  assert.equal(rows[0].durationMs, null);
  assert.equal(formatRowDuration(null), "");
});

const failed = results.filter((r) => !r.ok);
results.forEach((r) =>
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `\n      ${r.message}`}`),
);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

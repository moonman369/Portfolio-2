// ---- MoonMind step feed -> renderable rows ----
//
// The backend emits a flat feed of { seq, node, type, ts, summary } steps.
// This module turns that into the row tree the thinking-steps panel draws:
// `start` paired with its `end`/`error`, dotted nodes nested under their
// parent, and `tool` steps hung off the branch that owns them.
//
// Pure and dependency-free so it can be exercised by scripts/test-moonmind-steps.mjs.

// Labels come only from these tables — never from `summary`, which is debug text.
const NODE_LABELS = {
  router: "Understanding your question",
  knowledge: "Searching Ayan's portfolio",
  stats: "Fetching GitHub & LeetCode stats",
  agent: "Researching",
  // Retired alias for `agent`, kept alive for conversations started before the
  // taxonomy change. Same code, same label.
  tech_web: "Researching",
  action: "Preparing a response",
  refusal: "Preparing a response",
  capabilities: "Preparing a response",
  greeting: "Saying hello",
  generate: "Writing the answer",
  "knowledge.prepare": "Preparing the search",
  "knowledge.retrieve": "Retrieving documents",
  "knowledge.to_state": "Collecting results",
  "agent.scope_check": "Checking the topic",
};

const TOOL_LABELS = {
  web_search: "Searching the web",
  semantic_search: "Reading the portfolio",
  metadata_filter: "Reading the portfolio",
  resolve_time: "Working out the dates",
};

const titleCase = (value) =>
  String(value ?? "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/(^|\s)\S/g, (char) => char.toUpperCase());

// An unknown top-level node is "Working"; an unknown parent.child keeps its
// nesting and gets a generic label built from the child name.
export const labelForNode = (node) => {
  const name = String(node ?? "");
  if (NODE_LABELS[name]) return NODE_LABELS[name];
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "Working";
  return titleCase(name.slice(dot + 1)) || "Working";
};

// A tool step names its tool in the text before " -> ".
export const labelForTool = (summary) => {
  const tool = String(summary ?? "").split("->")[0].trim();
  return TOOL_LABELS[tool] ?? "Using a tool";
};

const depthOf = (node) => String(node ?? "").split(".").length - 1;

const timeOf = (ts) => {
  const parsed = Date.parse(ts);
  return Number.isFinite(parsed) ? parsed : null;
};

// Order by seq, drop anything unusable, and ignore repeated seq values (the
// first one wins — sort is stable, so that is the first the server sent).
export const normalizeSteps = (steps) => {
  const seen = new Set();
  return (Array.isArray(steps) ? steps : [])
    .filter((step) => step && Number.isFinite(step.seq))
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .filter((step) => {
      if (seen.has(step.seq)) return false;
      seen.add(step.seq);
      return true;
    });
};

// Build the flat, depth-tagged row list. `finished` closes any row still open
// when the run has stopped, so a completed run never shows a running spinner.
export const buildStepRows = (steps, { finished = false } = {}) => {
  const rows = [];
  const openByNode = new Map();
  let counter = 0;

  const addRow = (node, extra) => {
    const row = {
      key: `${node}-${counter++}`,
      node,
      kind: "node",
      depth: depthOf(node),
      label: labelForNode(node),
      state: "running",
      summary: "",
      durationMs: null,
      startedAt: null,
      ...extra,
    };
    rows.push(row);
    return row;
  };

  normalizeSteps(steps).forEach((step) => {
    const node = String(step.node ?? "");
    const ts = timeOf(step.ts);

    if (step.type === "start") {
      // A second visit to the same node opens a second row.
      openByNode.delete(node);
      openByNode.set(node, addRow(node, { startedAt: ts }));
      return;
    }

    if (step.type === "end" || step.type === "error") {
      // An `end` with no `start` still gets a row, but no duration to show.
      const row = openByNode.get(node) ?? addRow(node, {});
      openByNode.delete(node);
      row.state = step.type === "error" ? "warning" : "done";
      // An empty summary on an `end` is normal — several nodes have nothing
      // reportable. It is not a failure and must not read as one.
      row.summary = step.summary || "";
      row.durationMs =
        row.startedAt != null && ts != null ? ts - row.startedAt : null;
      return;
    }

    if (step.type === "tool") {
      // Tool steps carry the owning branch in `node` and have no `start`, so
      // they render as a completed child of that branch.
      addRow(node, {
        kind: "tool",
        depth: depthOf(node) + 1,
        label: labelForTool(step.summary),
        state: "done",
        summary: step.summary || "",
      });
    }
    // Any other type is ignored rather than guessed at.
  });

  if (finished) {
    rows.forEach((row) => {
      if (row.state === "running") row.state = "done";
    });
  }

  return rows;
};

// Whole-run duration, from the first step's ts to the last. Never below 1s,
// null when the timestamps are unusable.
export const runDurationSeconds = (steps) => {
  const list = normalizeSteps(steps);
  if (!list.length) return null;
  const first = timeOf(list[0].ts);
  const last = timeOf(list[list.length - 1].ts);
  if (first == null || last == null) return null;
  return Math.max(1, Math.round((last - first) / 1000));
};

export const formatRowDuration = (ms) => {
  if (!Number.isFinite(ms) || ms < 0) return "";
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
};

// The node the run is sitting on right now — the last row still open.
export const activeRowLabel = (rows) => {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i].state === "running") return rows[i].label;
  }
  return rows.length ? rows[rows.length - 1].label : null;
};

// The single line shown when the panel is minimized.
export const headerLabel = ({ rows = [], steps = [], isRunning = false }) => {
  if (isRunning) return activeRowLabel(rows) ?? "Thinking…";
  const seconds = runDurationSeconds(steps);
  return seconds == null ? "Thought process" : `Thought for ${seconds}s`;
};

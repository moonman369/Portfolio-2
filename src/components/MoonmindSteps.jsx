import { useState } from "react";
import { AlertTriangle, Check, ChevronRight, Loader2, Wrench } from "lucide-react";
import { cn } from "../lib/utils";

// Friendly labels for the agent nodes we know about today. The backend keeps
// adding nodes, so anything missing here falls back to a humanised name.
const NODE_LABELS = {
  router: "Understanding your question",
  about_me: "Searching Ayan's portfolio",
  "about_me.prepare": "Preparing the search",
  "about_me.retrieve": "Retrieving documents",
  "about_me.to_state": "Collecting results",
  stats: "Fetching GitHub & LeetCode stats",
  stats_and_docs: "Fetching stats and portfolio",
  tech_web: "Researching on the web",
  "tech_web.scope_check": "Checking the topic",
  generate: "Writing the answer",
  refusal: "Preparing a response",
  list_capabilities: "Preparing a response",
};

// "book_catchup.send_mail" -> "Send Mail"
const humanizeNode = (node) => {
  const leaf = String(node ?? "")
    .split(".")
    .pop()
    .replace(/[_-]+/g, " ")
    .trim();
  if (!leaf) return "Working";
  return leaf.replace(/\b\w/g, (char) => char.toUpperCase());
};

const labelForNode = (node) => NODE_LABELS[node] ?? humanizeNode(node);

// Depth of a dotted node name — "about_me.retrieve" is a sub-step of "about_me".
const depthOf = (node) => String(node ?? "").split(".").length - 1;

// Fold the raw start/end/tool/error stream into one row per node activity:
// `start` opens a row, `end` closes it (keeping its summary), `tool` and
// `error` attach to the row they belong to.
const toActivities = (steps) => {
  const activities = [];
  const openByNode = new Map();

  const rowFor = (node) => {
    const open = openByNode.get(node);
    if (open) return open;
    const created = {
      key: `${node}-${activities.length}`,
      node,
      depth: depthOf(node),
      state: "running",
      summary: "",
      tools: [],
      errors: [],
    };
    activities.push(created);
    openByNode.set(node, created);
    return created;
  };

  steps.forEach((step) => {
    const node = step?.node ?? "";
    switch (step?.type) {
      case "start":
        // A repeat visit to the same node starts a fresh row.
        openByNode.delete(node);
        rowFor(node);
        break;
      case "end": {
        const row = rowFor(node);
        row.summary = step.summary || row.summary;
        if (row.state !== "error") row.state = "done";
        openByNode.delete(node);
        break;
      }
      case "tool": {
        const row = rowFor(node);
        row.tools.push({ seq: step.seq, summary: step.summary || "tool call" });
        break;
      }
      case "error": {
        const row = rowFor(node);
        row.state = "error";
        row.errors.push({ seq: step.seq, summary: step.summary || "" });
        break;
      }
      default:
        rowFor(node);
    }
  });

  return activities;
};

const StateIcon = ({ state }) => {
  if (state === "error")
    return <AlertTriangle size={12} className="shrink-0 text-amber-500" />;
  if (state === "done")
    return <Check size={12} className="shrink-0 text-primary/80" />;
  return (
    <Loader2 size={12} className="shrink-0 text-primary animate-spin" />
  );
};

// Live agent trace shown while (and after) an answer is produced. Purely
// additive: if no steps ever arrive, nothing renders and the usual loading
// state carries the wait on its own.
const MoonmindSteps = ({ steps = [], isRunning = false, className }) => {
  const [override, setOverride] = useState(null);

  if (!steps.length) return null;

  const activities = toActivities(steps);
  const open = override ?? isRunning;

  return (
    <details
      open={open}
      onToggle={(e) => setOverride(e.currentTarget.open)}
      className={cn(
        "rounded-xl border border-border/50 bg-background/40 text-xs",
        className,
      )}
    >
      <summary className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer select-none text-muted-foreground list-none [&::-webkit-details-marker]:hidden">
        <ChevronRight
          size={12}
          className={cn("shrink-0 transition-transform", open && "rotate-90")}
        />
        {isRunning ? (
          <Loader2 size={12} className="shrink-0 text-primary animate-spin" />
        ) : null}
        <span className="truncate">
          {isRunning
            ? labelForNode(activities[activities.length - 1]?.node)
            : `How I got this answer · ${activities.length} steps`}
        </span>
      </summary>

      <ul className="px-2.5 pb-2 space-y-1">
        {activities.map((activity) => (
          <li key={activity.key} style={{ paddingLeft: activity.depth * 12 }}>
            <div className="flex items-start gap-1.5">
              <span className="mt-0.5">
                <StateIcon state={activity.state} />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "text-foreground/90",
                    activity.state === "running" && "text-foreground",
                  )}
                >
                  {labelForNode(activity.node)}
                </span>
                {activity.summary && (
                  <span className="ml-1.5 text-muted-foreground/70 break-words">
                    {activity.summary}
                  </span>
                )}
              </span>
            </div>

            {activity.tools.map((tool) => (
              <div
                key={`tool-${tool.seq}`}
                className="flex items-start gap-1.5 pl-3 text-muted-foreground/70"
              >
                <Wrench size={11} className="shrink-0 mt-0.5" />
                <span className="break-words">{tool.summary}</span>
              </div>
            ))}

            {activity.errors.map((issue) => (
              <div
                key={`error-${issue.seq}`}
                className="flex items-start gap-1.5 pl-3 text-amber-500/80"
              >
                <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                <span className="break-words">
                  {issue.summary || "This step failed — continuing anyway"}
                </span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </details>
  );
};

export default MoonmindSteps;

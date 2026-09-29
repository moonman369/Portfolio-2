import { useEffect, useId, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Loader2, Wrench } from "lucide-react";
import { cn } from "../lib/utils";
import {
  buildStepRows,
  formatRowDuration,
  headerLabel,
} from "../lib/moonmindSteps";

const StateIcon = ({ state, kind }) => {
  if (state === "warning")
    return <AlertTriangle size={12} aria-hidden="true" className="shrink-0 text-earthshine" />;
  if (state === "running")
    return <Loader2 size={12} aria-hidden="true" className="shrink-0 text-earthshine animate-spin" />;
  if (kind === "tool")
    return <Wrench size={12} aria-hidden="true" className="shrink-0 text-muted-foreground" />;
  return <Check size={12} aria-hidden="true" className="shrink-0 text-primary" />;
};

// While a run is going: the top-level stages as a small mono pipeline. Each
// node fades in and its connector draws as it arrives (CSS, once per node —
// keys are stable as steps append); the running stage glows earthshine.
// Decorative: the header label already says what is happening, and the full
// list is behind the toggle.
const Pipeline = ({ rows }) => {
  const stages = rows.filter((row) => row.depth === 0 && row.kind === "node");
  if (!stages.length) return null;
  return (
    <ol
      aria-hidden="true"
      className="flex flex-wrap items-center gap-y-1.5 px-3 pb-2.5 font-mono text-[11px]"
    >
      {stages.map((stage, index) => (
        <li key={stage.key} className="mm-stage flex items-center">
          {index > 0 && <span className="mm-connector" />}
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              stage.state === "running"
                ? "text-earthshine"
                : "text-muted-foreground",
            )}
          >
            <span className="mm-dot" data-state={stage.state} />
            {stage.label}
          </span>
        </li>
      ))}
    </ol>
  );
};

// The thinking-steps panel that sits above every answer produced by a run.
// Always minimized to a single header row; the list opens only when the user
// activates the toggle, and each message keeps its own state. While running
// and closed, a live pipeline sits under the header; once the answer lands
// it folds away and the header carries the route as a badge.
const MoonmindSteps = ({
  steps = [],
  isRunning = false,
  route,
  status,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [settled, setSettled] = useState(false);
  const bodyId = useId();

  // Hold the thinking glow back briefly so a ~1s run never flashes it.
  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = setTimeout(() => setSettled(true), 300);
    return () => clearTimeout(timer);
  }, [isRunning]);

  const rows = buildStepRows(steps, { finished: !isRunning });
  const label = headerLabel({ rows, steps, isRunning });
  const shimmering = isRunning && settled;

  return (
    <div
      className={cn(
        // Clips the thinking glow to the card's rounded edge.
        "relative isolate overflow-hidden rounded-xl border border-border bg-muted/40 text-xs",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={bodyId}
        className={cn(
          "flex w-full min-h-9 items-center gap-2 px-3 py-1.5 rounded-xl text-left",
          "font-mono text-muted-foreground hover:text-foreground",
          // Inset, so the card's clipping can never hide the focus ring.
          "focus-visible:[outline-offset:-2px]",
          // Thinking: a warm glow sweeps across the header (see .mm-thinking).
          shimmering && "mm-thinking",
        )}
      >
        <ChevronRight
          size={12}
          aria-hidden="true"
          className={cn("mm-chevron shrink-0", open && "mm-chevron-open")}
        />
        {shimmering && <span aria-hidden="true" className="mm-orb" />}
        <span className={cn("flex-1 truncate", isRunning && "text-foreground")}>
          {label}
        </span>
        {!isRunning && route && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] ring-1 ring-inset",
              status === "failed"
                ? "text-earthshine ring-earthshine/40"
                : "text-primary ring-primary/30",
            )}
          >
            {route}
          </span>
        )}
      </button>

      {isRunning && !open && <Pipeline rows={rows} />}

      <div id={bodyId} className="mm-collapse" data-open={open || undefined}>
        <div>
          <ul className="px-3 pb-2.5 pt-0.5 space-y-1 font-mono text-[11px]">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex items-start gap-1.5"
                style={{ paddingLeft: row.depth * 12 }}
              >
                <span className="mt-[3px]">
                  <StateIcon state={row.state} kind={row.kind} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "text-foreground",
                      row.state === "running" && "text-earthshine",
                    )}
                  >
                    {row.label}
                  </span>
                  {/* `summary` is debug text: muted, never the label. */}
                  {row.summary && (
                    <span className="ml-1.5 text-muted-foreground break-words">
                      {row.summary}
                    </span>
                  )}
                </span>
                {row.durationMs != null && (
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatRowDuration(row.durationMs)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MoonmindSteps;

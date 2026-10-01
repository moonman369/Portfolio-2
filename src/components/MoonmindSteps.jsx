import { useEffect, useId, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import {
  buildStepRows,
  formatRowDuration,
  headerLabel,
} from "../lib/moonmindSteps";

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
          {/* The live pipeline's connect-the-dots, run vertically: one rail,
              a dot per step, nested steps branching off it. Opening the
              panel draws it in a segment at a time (see .mm-trace). Just the
              step names and durations — the backend's debug summaries are
              not shown. */}
          <ol className="mm-trace px-3 pb-3 pt-1 font-mono text-[11px]">
            {rows.map((row, index) => (
              <li
                key={row.key}
                className="mm-trace-row"
                data-nested={row.depth > 0 || undefined}
                style={{ "--i": index, "--depth": row.depth }}
              >
                <span
                  aria-hidden="true"
                  className="mm-dot"
                  data-state={row.state}
                  data-kind={row.kind}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words",
                    row.state === "running"
                      ? "text-earthshine"
                      : row.kind === "tool"
                        ? "text-muted-foreground"
                        : "text-foreground",
                  )}
                >
                  {row.label}
                </span>
                {row.durationMs != null && (
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatRowDuration(row.durationMs)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MoonmindSteps;

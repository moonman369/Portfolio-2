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
    return <AlertTriangle size={11} className="shrink-0 text-amber-500/90" />;
  if (state === "running")
    return <Loader2 size={11} className="shrink-0 text-primary animate-spin" />;
  if (kind === "tool")
    return <Wrench size={11} className="shrink-0 text-muted-foreground/70" />;
  return <Check size={11} className="shrink-0 text-primary/70" />;
};

// The thinking-steps panel that sits above every answer produced by a run.
// Always minimized to a single header row; the list opens only when the user
// activates the toggle, and each message keeps its own state.
const MoonmindSteps = ({ steps = [], isRunning = false, className }) => {
  const [open, setOpen] = useState(false);
  const [settled, setSettled] = useState(false);
  const bodyId = useId();

  // Hold the shimmer back briefly so a ~1s run never flashes it.
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
        "rounded-lg border border-border/40 bg-muted/20 text-[11px]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={bodyId}
        className={cn(
          "flex w-full items-center gap-1.5 px-2 py-1 rounded-lg text-left",
          "text-muted-foreground hover:text-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        )}
      >
        <ChevronRight
          size={11}
          className={cn("mm-chevron shrink-0", open && "mm-chevron-open")}
        />
        <span className={cn("truncate", shimmering && "mm-shimmer")}>
          {label}
        </span>
      </button>

      <div id={bodyId} className="mm-collapse" data-open={open || undefined}>
        <div>
          <ul className="px-2 pb-1.5 pt-0.5 space-y-0.5">
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
                      "text-foreground/80",
                      row.state === "running" && "text-foreground",
                    )}
                  >
                    {row.label}
                  </span>
                  {/* `summary` is debug text: muted, never the label. */}
                  {row.summary && (
                    <span className="ml-1.5 text-muted-foreground/60 break-words">
                      {row.summary}
                    </span>
                  )}
                </span>
                {row.durationMs != null && (
                  <span className="shrink-0 tabular-nums text-muted-foreground/50">
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

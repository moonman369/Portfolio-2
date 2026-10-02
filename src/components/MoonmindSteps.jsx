import { useEffect, useId, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import {
  buildStepRows,
  formatStepSeconds,
  headerLabel,
  visibleRows,
} from "../lib/moonmindSteps";
import {
  MOONMIND_DETAILS_LABEL,
  MOONMIND_ROUTE_LABELS,
} from "../context/constants";
import MoonLoader from "./MoonLoader";

// Nothing shows for the first moments of a run, so a quick one never
// flashes the panel.
const HOLD_MS = 300;

// The loader's phase. The API does not say how many steps a run will take,
// so the moon moves through four phases, one per finished top-level stage,
// and holds on the last until the answer lands.
const LOADER_PHASES = [0.2, 0.45, 0.7, 0.85];
const loaderPhase = (rows) => {
  const finished = rows.filter(
    (row) => row.depth === 0 && row.kind === "node" && row.state !== "running",
  ).length;
  return LOADER_PHASES[Math.min(finished, LOADER_PHASES.length - 1)];
};

// While running, under the status line: the top-level stages as a small
// pipeline. Finished stages are grey with their names; the current one is
// an amber dot only, because its name is already in the status line above
// (said once). Each node fades in and its connector draws as it arrives
// (CSS, once per node: keys are stable as steps append). Decorative.
const Pipeline = ({ rows }) => {
  const stages = rows.filter((row) => row.depth === 0 && row.kind === "node");
  if (!stages.length) return null;
  return (
    <ol
      aria-hidden="true"
      className="flex flex-wrap items-center gap-y-1.5 px-3 pb-2.5 font-mono text-xs text-muted-foreground"
    >
      {stages.map((stage, index) => (
        <li key={stage.key} className="mm-stage flex items-center">
          {index > 0 && <span className="mm-connector" />}
          <span className="inline-flex items-center gap-1.5">
            <span className="mm-dot" data-state={stage.state} />
            {stage.state !== "running" && stage.label}
          </span>
        </li>
      ))}
    </ol>
  );
};

// One row of the expanded trace. Durations only on top-level rows.
const TraceRow = ({ row, index }) => (
  <li
    className="mm-trace-row"
    data-nested={row.depth > 0 || undefined}
    style={{ "--i": index, "--depth": row.depth }}
  >
    <span aria-hidden="true" className="mm-dot" data-state={row.state} data-kind={row.kind} />
    <span
      className={cn(
        "min-w-0 flex-1 break-words",
        row.depth > 0 ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {row.label}
    </span>
    {row.depth === 0 && row.durationMs != null && (
      <span className="shrink-0 tabular-nums text-muted-foreground">
        {formatStepSeconds(row.durationMs)}
      </span>
    )}
  </li>
);

// The thinking-steps panel above every answer produced by a run. Minimized
// to one line; the list opens only when the visitor activates the toggle,
// and each message keeps its own state.
//
//   running    one status line: the moon loader (amber, pulsing gently,
//              filling as stages finish) and the current step's name,
//              once; the pipeline below it. Fades in after 300ms with
//              "Thinking…" if no step has arrived yet.
//   finished   chevron, "Thought for Ns", and the route in plain words
//   open       the top-level steps with their durations; sub-steps behind
//              "Details". Rows under 300ms fold into their parent.
const MoonmindSteps = ({ steps = [], isRunning = false, route, status, className }) => {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [settled, setSettled] = useState(false);
  const bodyId = useId();

  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = setTimeout(() => setSettled(true), HOLD_MS);
    return () => clearTimeout(timer);
  }, [isRunning]);

  const rows = visibleRows(buildStepRows(steps, { finished: !isRunning }));
  const label = headerLabel({ rows, steps, isRunning });
  const topRows = rows.filter((row) => row.depth === 0);
  const hasDetails = rows.length > topRows.length;
  const listed = details ? rows : topRows;
  const routeLabel = route ? (MOONMIND_ROUTE_LABELS[route] ?? route) : null;

  if (isRunning && !settled) return null;

  return (
    <div
      className={cn(
        "mm-steps rounded-xl border border-border bg-muted/40 text-xs",
        isRunning && "mm-steps-live",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={bodyId}
        className={cn(
          "flex w-full min-h-11 items-center gap-2 px-3 py-1.5 rounded-xl text-left",
          "font-mono text-muted-foreground hover:text-foreground",
        )}
      >
        <ChevronRight
          size={14}
          aria-hidden="true"
          className={cn("mm-chevron shrink-0", open && "mm-chevron-open")}
        />
        {isRunning && (
          <MoonLoader phase={loaderPhase(rows)} pulse className="text-earthshine" />
        )}
        <span className={cn("flex-1 truncate", isRunning && "text-foreground")}>
          {label}
        </span>
        {!isRunning && routeLabel && (
          <span
            title={route}
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 font-sans ring-1 ring-inset",
              status === "failed"
                ? "text-earthshine ring-earthshine/40"
                : "text-primary ring-primary/30",
            )}
          >
            {routeLabel}
          </span>
        )}
      </button>

      {isRunning && !open && <Pipeline rows={rows} />}

      {/* Rendered only while open, so a running step's name is never in the
          page twice behind a closed toggle. */}
      <div id={bodyId} className="mm-collapse" data-open={open || undefined}>
        <div>
          {open && (
            <div className="px-3 pb-3 pt-1 font-mono text-xs">
              <ol className="mm-trace">
                {listed.map((row, index) => (
                  <TraceRow key={row.key} row={row} index={index} />
                ))}
              </ol>
              {hasDetails && (
                <button
                  type="button"
                  onClick={() => setDetails((prev) => !prev)}
                  aria-expanded={details}
                  className="mt-1 -ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight
                    size={14}
                    aria-hidden="true"
                    className={cn("mm-chevron", details && "mm-chevron-open")}
                  />
                  {MOONMIND_DETAILS_LABEL}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoonmindSteps;

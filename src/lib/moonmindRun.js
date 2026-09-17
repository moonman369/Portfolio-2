// ---- One MoonMind run, start to finish ----
//
// Kept out of the provider so the lifecycle — especially "this run no longer
// owns the conversation" — can be exercised without a DOM.

import { pollRunUntilDone, startRun } from "./moonmindApi";

// One token per run. Starting a run takes the next token; refreshing the chat
// burns it. Anything holding an older token is stale and must not write state.
export const createRunGuard = () => {
  let current = 0;
  return {
    begin: () => {
      current += 1;
      return current;
    },
    invalidate: () => {
      current += 1;
      return current;
    },
    isStale: (token) => token !== current,
  };
};

// Starts a run and polls it to completion. Resolves with { run, final }, or
// with null if the run was orphaned — by a refresh — at any point along the
// way. Nothing is handed to the callbacks once that happens, so a late 202
// can never write back a session the visitor has already discarded.
export const executeRun = async ({
  message,
  sessionId,
  signal,
  deadlineAt,
  guard,
  token,
  onStarted,
  onSnapshot,
}) => {
  const run = await startRun({ message, sessionId, signal });
  if (guard.isStale(token)) return null;
  onStarted?.(run);

  const final = await pollRunUntilDone({
    runId: run?.runId,
    signal,
    deadlineAt,
    onSnapshot: (snapshot) => {
      if (!guard.isStale(token)) onSnapshot?.(snapshot);
    },
  });

  if (guard.isStale(token)) return null;
  return { run, final };
};

// ---- Moonmind agent API (POST /runs + GET /runs/:id?since=) ----
//
// The backend answers through an agent graph: `POST /runs` starts a run and
// returns immediately with a `runId`, then `GET /runs/:runId?since=<seq>`
// streams the agent's steps until the run leaves the "running" state.

const HOSTNAME = import.meta.env.VITE_PORTFOLIO_API_HOSTNAME;
const MOONMIND_EP = import.meta.env.VITE_PORTFOLIO_API_MOONMIND_ENDPOINT;
const CHAT_EP = import.meta.env.VITE_PORTFOLIO_API_MOONMIND_CHAT_ENDPOINT;
const PASSWORD = import.meta.env.VITE_PORTFOLIO_API_MOONMIND_CHAT_PASSWORD;

const trimSlashes = (value) => value.replace(/\/+$/, "");

// Base path of the Moonmind endpoints (e.g. "/api/v1/moonmind"). Prefer the
// explicit base var; otherwise derive it from the legacy chat path so an older
// .env keeps working untouched.
const resolveBasePath = () => {
  if (MOONMIND_EP) return trimSlashes(MOONMIND_EP);
  if (CHAT_EP) return trimSlashes(CHAT_EP).replace(/\/chat$/, "");
  return null;
};

const BASE_PATH = resolveBasePath();

export const MOONMIND_BASE_URL =
  HOSTNAME && BASE_PATH ? `${trimSlashes(HOSTNAME)}${BASE_PATH}` : null;

export const isMoonmindConfigured = Boolean(MOONMIND_BASE_URL);

// Poll cadence, and the wall-clock deadline measured from the moment the run
// was started — the server closes runs at 120s, so we give up just after.
export const POLL_INTERVAL_MS = 900;
export const RUN_DEADLINE_MS = 130_000;
const MAX_CONSECUTIVE_FAILURES = 5;
const BACKOFF_MS = [1000, 2000, 4000, 8000];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Legacy sessions used a client-minted id; the new API mints UUIDs itself, so
// anything that isn't one is dropped rather than sent and rejected.
export const isValidSessionId = (value) =>
  typeof value === "string" && UUID_RE.test(value);

export class MoonmindApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = "MoonmindApiError";
    this.status = status;
    this.code = code;
  }
}

export const isAbortError = (err) =>
  err?.name === "AbortError" || err?.code === 20;

const abortError = () => {
  const err = new Error("Aborted");
  err.name = "AbortError";
  return err;
};

// A 4xx is the server telling us the request itself is wrong — retrying it
// changes nothing. Network blips and 5xx are worth another attempt.
const isFatal = (err) =>
  err instanceof MoonmindApiError &&
  typeof err.status === "number" &&
  err.status >= 400 &&
  err.status < 500;

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });

const request = async (path, { method = "GET", body, signal } = {}) => {
  if (!MOONMIND_BASE_URL) {
    throw new MoonmindApiError("Moonmind API is not configured", {
      code: "NOT_CONFIGURED",
    });
  }

  const headers = { "Content-Type": "application/json" };
  if (PASSWORD) headers.password = PASSWORD;

  const res = await fetch(`${MOONMIND_BASE_URL}${path}`, {
    method,
    headers,
    signal,
    ...(body ? { body: JSON.stringify(body) } : null),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || payload?.status === "error") {
    throw new MoonmindApiError(
      payload?.message || `Moonmind API ${res.status}`,
      { status: res.status, code: payload?.code },
    );
  }

  return payload?.data ?? {};
};

// POST /runs -> 202 { runId, sessionId }. Omitting sessionId mints a new one.
export const startRun = ({ message, sessionId, signal }) =>
  request("/runs", {
    method: "POST",
    signal,
    body: {
      message,
      ...(isValidSessionId(sessionId) ? { sessionId } : null),
    },
  });

// GET /runs/:runId?since=<seq> -> only the steps after that cursor.
export const fetchRun = ({ runId, since = 0, signal }) =>
  request(`/runs/${encodeURIComponent(runId)}?since=${since}`, { signal });

// Poll a run to completion, handing every snapshot to `onSnapshot` as it
// arrives. Resolves with the final snapshot; rejects on abort, on a fatal API
// error, or once the deadline passes. Polls are strictly sequential, so a new
// request is never sent while the previous one is still in flight, and time
// spent in backoff counts against the same deadline.
export const pollRunUntilDone = async ({
  runId,
  signal,
  onSnapshot,
  deadlineAt,
}) => {
  const deadline = Number.isFinite(deadlineAt)
    ? deadlineAt
    : Date.now() + RUN_DEADLINE_MS;
  let since = 0;
  let failures = 0;

  while (Date.now() < deadline) {
    try {
      const snapshot = await fetchRun({ runId, since, signal });
      failures = 0;
      if (Number.isFinite(snapshot?.nextSince)) since = snapshot.nextSince;
      onSnapshot?.(snapshot);
      if (snapshot?.status && snapshot.status !== "running") return snapshot;
    } catch (err) {
      if (isAbortError(err) || isFatal(err)) throw err;
      failures += 1;
      if (failures >= MAX_CONSECUTIVE_FAILURES) throw err;
      // Transient: the run keeps going server-side whether we listen or not.
      await sleep(BACKOFF_MS[failures - 1] ?? 8000, signal);
      continue;
    }

    await sleep(POLL_INTERVAL_MS, signal);
  }

  throw new MoonmindApiError("Moonmind run timed out", { code: "RUN_TIMEOUT" });
};

// Unescape literal "\n" / "\r\n" / "\t" the API may send inside the answer.
const normalizeMarkdownText = (value = "") =>
  value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");

export const readAnswer = (value) =>
  typeof value === "string" ? normalizeMarkdownText(value).trim() : "";

// Fold a run snapshot into the fields a chat message holds. Returns values
// identical to the current ones when a poll brought nothing new, so the caller
// can skip the state update entirely.
export const snapshotToPatch = (message, snapshot) => {
  const answer = readAnswer(snapshot?.answer);
  return {
    // An `error` step is not a failed run — only `status` decides that.
    status: snapshot?.status ?? message.status,
    route: snapshot?.route ?? message.route,
    steps: mergeSteps(message.steps, snapshot?.steps),
    content: answer || message.content,
    documents: snapshot?.documents?.length
      ? snapshot.documents
      : message.documents,
  };
};

// Steps arrive as deltas — append, drop duplicates, keep `seq` order.
export const mergeSteps = (existing = [], incoming = []) => {
  if (!incoming.length) return existing;
  const bySeq = new Map(existing.map((step) => [step.seq, step]));
  incoming.forEach((step) => {
    if (step && Number.isFinite(step.seq)) bySeq.set(step.seq, step);
  });
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq);
};

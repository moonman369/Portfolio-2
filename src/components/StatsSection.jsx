import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { useInView } from "../hooks/useInView";
import { useCountUp } from "../hooks/useCountUp";
import {
  useFinePointer,
  usePrefersReducedMotion,
} from "../hooks/usePrefersReducedMotion";
import {
  Award,
  Cpu,
  ExternalLink,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  Github,
  Star,
} from "lucide-react";
// Namespace imports so a missing brand icon can't break the build.
import * as Si from "react-icons/si";
import * as Vsc from "react-icons/vsc";
import * as Md from "react-icons/md";
import { CERTIFICATES, GITHUB_USERNAME } from "../context/constants";
import { RiClaudeFill } from "react-icons/ri";
import { GrOracle } from "react-icons/gr";
import { BsClaude } from "react-icons/bs";

// ---- Config (Vite env vars; unset => that fetch is skipped) ----
const HOSTNAME = import.meta.env.VITE_PORTFOLIO_API_HOSTNAME;
const LEETCODE_EP = import.meta.env.VITE_PORTFOLIO_API_LEETCODE_ENDPOINT;
const GITHUB_EP = import.meta.env.VITE_PORTFOLIO_API_GITHUB_ENDPOINT;
const USERNAME = import.meta.env.VITE_USERNAME;
const GEO_KEY = import.meta.env.VITE_GEO_API_KEY;

const LEETCODE_API_ENDPOINT =
  HOSTNAME && LEETCODE_EP ? `${HOSTNAME}${LEETCODE_EP}${USERNAME ?? ""}` : null;
const GITHUB_API_ENDPOINT =
  HOSTNAME && GITHUB_EP ? `${HOSTNAME}${GITHUB_EP}` : null;

const ghUser = USERNAME || GITHUB_USERNAME;
const GITHUB_SUMMARY_CARD = `https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=${ghUser}&theme=midnight_purple`;

// Whole-card destinations.
const LEETCODE_PROFILE_URL = "https://leetcode.com/u/moonman369/";
const GITHUB_PROFILE_URL = "https://github.com/moonman369";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---- Animation config ----
// Hovering a stat replays its count-up. Off: hover stays decorative.
const HOVER_REPLAYS_COUNT = false;
// Re-animate when the section scrolls back into view. Off: animate once.
const REPLAY_ON_REENTER = false;

const COUNT_DURATION_MS = 1200; // every number except the rank
const RANK_DURATION_MS = 900; // the rank settles a little quicker
const RANK_QUANTIZE = 500; // rank ticks in 500s — try 100 or 1000
const RING_DURATION_MS = 900; // keep in step with .stats-ring-progress
const BAR_STAGGER_MS = 120; // Easy, then Medium, then Hard
const CARD_STAGGER_MS = 80; // GitHub rows cascade in DOM order
const HOVER_REST_MS = 200; // the pointer must settle before a replay
const HOVER_COOLDOWN_MS = 2000; // and the stat must have been still this long

// ---- localStorage cache (replaces the legacy 30-day cookies) ----
const readCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (expiry && Date.now() > expiry) return null;
    return data;
  } catch {
    return null;
  }
};

const writeCache = (key, data) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ data, expiry: Date.now() + CACHE_TTL_MS }),
    );
  } catch {
    /* storage full / unavailable — non-fatal */
  }
};

// ---- Fetchers ----
const fetchLeetcodeProfile = async () => {
  if (!LEETCODE_API_ENDPOINT) return null;
  const res = await fetch(LEETCODE_API_ENDPOINT, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`LeetCode API ${res.status}`);
  return res.json();
};

const fetchGitHubProfile = async () => {
  if (!GITHUB_API_ENDPOINT) return null;
  const res = await fetch(GITHUB_API_ENDPOINT, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const body = await res.json();
  const s = body?.stats ?? {};
  return {
    totalRepos: s.repos ?? 0,
    totalCommits: s.commits ?? 0,
    totalStars: s.stars ?? 0,
    totalPRs: s.pulls ?? 0,
  };
};

const fetchGeolocation = async () => {
  if (!GEO_KEY) return;
  try {
    const res = await fetch(
      `https://ipgeolocation.abstractapi.com/v1/?api_key=${GEO_KEY}`,
    );
    console.log(await res.json());
  } catch {
    /* best-effort, ignore */
  }
};

// Resolve a brand icon by key, falling back to a generic award icon.
const CERT_ICONS = {
  claude: RiClaudeFill,
  oracle: GrOracle, // Oracle brand icon removed from react-icons v5
  tcs: Si.SiTcs,
  coursera: Si.SiCoursera,
  ibm: Cpu, // IBM brand icon removed from react-icons v5
  azure: Vsc.VscAzure,
  intern: Md.MdWorkOutline,
  block: Si.SiHiveBlockchain || Si.SiBlockchaindotcom,
  google: Si.SiGoogle,
  eth: Si.SiEthereum,
};

// Brand colors for certificate icons (from the legacy stats.css).
const CERT_COLORS = {
  claude: "#DE7356",
  oracle: "#f80000",
  ibm: "#d3e0f5",
  tcs: "#5bbed3",
  coursera: "#16a34a",
  azure: "rgb(0, 127, 255)",
  intern: "rgb(231, 85, 117)",
  block: "rgb(201, 92, 228)",
  google: "rgb(233, 186, 86)",
  eth: "rgb(102, 218, 179)",
  hack: "rgb(95, 233, 102)",
};

// Per-metric accent colors for the GitHub stat badges/icons.
const GITHUB_COLORS = {
  repos: "rgb(231, 85, 117)",
  commits: "rgb(185, 80, 247)",
  prs: "rgb(243, 142, 75)",
  stars: "rgb(235, 196, 25)",
};

// Delays a trigger so a group of elements cascades instead of firing at once.
const useStaggeredActive = (active, delayMs = 0) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => setReady(true), delayMs);
    return () => {
      clearTimeout(timer);
      setReady(false);
    };
  }, [active, delayMs]);

  return active && ready;
};

// The gated hover-replay path. Shipped off; flipping HOVER_REPLAYS_COUNT makes
// a deliberate rest over one stat replay that stat, and nothing else.
const useHoverReplay = ({ doneAtRef, onReplay }) => {
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const timerRef = useRef(0);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!HOVER_REPLAYS_COUNT || !finePointer || reducedMotion) return {};

  return {
    onPointerEnter: () => {
      // Only once the entry animation has finished.
      if (!doneAtRef.current) return;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (Date.now() - doneAtRef.current >= HOVER_COOLDOWN_MS) onReplay();
      }, HOVER_REST_MS);
    },
    // Leaving early cancels the pending replay.
    onPointerLeave: () => clearTimeout(timerRef.current),
  };
};

// One counting number. Renders today's plain value until its data is in and
// the trigger fires, and is hidden from screen readers — `srLabel` carries the
// real figure instead, once, with no live region.
const AnimatedNumber = ({
  value,
  active,
  duration = COUNT_DURATION_MS,
  quantize = 1,
  className,
  srLabel,
}) => {
  const [replayKey, setReplayKey] = useState(0);
  const display = useCountUp(value, { active, duration, quantize, replayKey });

  // When the count finished, so hover knows whether a replay is allowed.
  const doneAtRef = useRef(null);
  useEffect(() => {
    const settled = display !== null && display === value;
    doneAtRef.current = settled ? (doneAtRef.current ?? Date.now()) : null;
  }, [display, value]);

  const hover = useHoverReplay({
    doneAtRef,
    onReplay: () => setReplayKey((key) => key + 1),
  });

  const fallback = Number.isFinite(value) ? value : 0;
  const shown = display ?? fallback;

  return (
    <>
      <span
        aria-hidden="true"
        className={cn("stats-number", className)}
        // Hold the final width from the start so counting cannot shift layout.
        style={{ minWidth: `${String(fallback).length}ch` }}
        {...hover}
      >
        {shown}
      </span>
      {srLabel != null && <span className="sr-only">{srLabel}</span>}
    </>
  );
};

const CircularProgress = ({ percentage, solved, total, active }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const reducedMotion = usePrefersReducedMotion();
  const hasValue = Number.isFinite(percentage);
  const clamped = Math.max(0, Math.min(100, percentage || 0));

  // Empty unless the ring has been triggered. This has to be the *initial*
  // render, not something an effect applies afterwards, or the ring flashes
  // full for a frame before animating.
  const filled = active || reducedMotion;
  const offset = filled
    ? circumference - (clamped / 100) * circumference
    : circumference;

  // The percentage counts in tenths so the hook can stay integer-only.
  const tenths = useCountUp(hasValue ? Math.round(clamped * 10) : null, {
    active,
    duration: RING_DURATION_MS,
  });
  const shown = ((tenths ?? 0) / 10).toFixed(1);

  const label = hasValue
    ? `Solved ${solved} of ${total} problems, ${clamped.toFixed(1)} percent`
    : "Problems solved, not available yet";

  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      className="shrink-0"
      role="img"
      aria-label={label}
    >
      <circle
        cx="70"
        cy="70"
        r={radius}
        strokeWidth="8"
        fill="none"
        stroke="hsl(var(--track))"
      />
      {/* Hover decoration only — see the .stats-* block in index.css. */}
      <circle
        cx="70"
        cy="70"
        r={radius}
        strokeWidth="8"
        fill="none"
        className="stats-ring-sweep stroke-primary"
      />
      <circle
        cx="70"
        cy="70"
        r={radius}
        strokeWidth="8"
        strokeLinecap="round"
        className="stats-ring-progress fill-none stroke-primary"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
      />
      <text
        x="70"
        y="70"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-semibold"
        fontSize="20"
        aria-hidden="true"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {shown}%
      </text>
    </svg>
  );
};

const DifficultyBar = ({ label, solved, total, color, active, delay }) => {
  const started = useStaggeredActive(active, delay);
  const reducedMotion = usePrefersReducedMotion();
  const hasValue = Number.isFinite(solved) && Number.isFinite(total);
  const pct = hasValue && total ? (solved / total) * 100 : 0;
  const filled = started || reducedMotion;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium" style={{ color }}>
          {label}
        </span>
        <span className="text-muted-foreground">
          {/* Only the solved half counts; the total is shown straight away. */}
          <AnimatedNumber value={solved} active={started} />
          <span aria-hidden="true"> / {total ?? 0}</span>
          <span className="sr-only">
            {solved ?? 0} of {total ?? 0} solved
          </span>
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "hsl(var(--track) / 0.6)" }}
      >
        <div
          className="stats-bar-fill h-2 rounded-full"
          style={{
            width: `${filled ? pct : 0}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

const GitHubStat = ({ icon: Icon, label, value, color, active, delay }) => {
  const started = useStaggeredActive(active, delay);

  return (
    <li className="flex items-center gap-3">
      <Icon className="h-5 w-5 shrink-0" style={{ color }} />
      <p className="text-sm">
        {label}:{" "}
        <span className="font-semibold text-primary">
          <AnimatedNumber
            value={value}
            active={started}
            srLabel={String(value ?? 0)}
          />
        </span>
      </p>
    </li>
  );
};

const StatsSection = () => {
  const [leetcodeStats, setLeetcodeStats] = useState(
    () => readCache("leetcodeCache") ?? {},
  );
  const [gitHubStats, setGitHubStats] = useState(
    () => readCache("githubCache") ?? {},
  );

  useEffect(() => {
    fetchLeetcodeProfile()
      .then((data) => {
        if (data) {
          setLeetcodeStats(data);
          writeCache("leetcodeCache", data);
        }
      })
      .catch((err) => console.error("LeetCode fetch failed:", err));

    fetchGitHubProfile()
      .then((data) => {
        if (data) {
          setGitHubStats(data);
          writeCache("githubCache", data);
        }
      })
      .catch((err) => console.error("GitHub fetch failed:", err));

    fetchGeolocation();
  }, []);

  // Animate once both things are true: the card is on screen and its data has
  // actually arrived. Whichever happens last is the trigger, so a cold load
  // that resolves while the section is already visible still animates.
  const [leetcodeRef, leetcodeInView] = useInView({
    once: !REPLAY_ON_REENTER,
  });
  const [githubRef, githubInView] = useInView({ once: !REPLAY_ON_REENTER });

  // Deliberately un-defaulted: a missing field must stay undefined so a
  // loading or failed card renders its plain zero and never counts.
  const solved = leetcodeStats?.totalSolved;
  const totalQuestions = leetcodeStats?.totalQuestions;
  const ranking = leetcodeStats?.ranking;
  const leetcodeActive = leetcodeInView && Number.isFinite(solved);
  const solvedPct =
    Number.isFinite(solved) && totalQuestions
      ? (solved * 100) / totalQuestions
      : null;

  const githubActive =
    githubInView && Number.isFinite(gitHubStats?.totalRepos);

  const githubItems = [
    {
      icon: FolderGit2,
      label: "Total Repositories",
      value: gitHubStats?.totalRepos,
      color: GITHUB_COLORS.repos,
    },
    {
      icon: GitCommit,
      label: "Total Commits",
      value: gitHubStats?.totalCommits,
      color: GITHUB_COLORS.commits,
    },
    {
      icon: GitPullRequest,
      label: "Total Pull Requests",
      value: gitHubStats?.totalPRs,
      color: GITHUB_COLORS.prs,
    },
    {
      icon: Star,
      label: "Total Stars",
      value: gitHubStats?.totalStars,
      color: GITHUB_COLORS.stars,
    },
  ];

  return (
    <section id="stats" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-6xl">
        {/* <p className="text-center text-primary font-medium mb-2">
          Platforms I use
        </p>*/}
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
          My <span className="text-gradient">Stats</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LeetCode */}
          <a
            ref={leetcodeRef}
            href={LEETCODE_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="stats-card glass rounded-lg p-6 card-hover text-left block"
          >
            <div className="flex items-center gap-3 mb-6">
              {Si.SiLeetcode && (
                <Si.SiLeetcode className="h-7 w-7 text-primary" />
              )}
              <h3 className="text-xl font-semibold">LeetCode Stats</h3>
            </div>

            <div className="flex items-center gap-6 mb-6">
              <CircularProgress
                percentage={solvedPct}
                solved={solved}
                total={totalQuestions}
                active={leetcodeActive}
              />
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Solved</p>
                  <p className="text-2xl font-bold text-primary">
                    <AnimatedNumber
                      value={solved}
                      active={leetcodeActive}
                      srLabel={String(solved ?? 0)}
                    />
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rank</p>
                  <p className="text-lg font-semibold">
                    <AnimatedNumber
                      value={ranking}
                      active={leetcodeActive}
                      duration={RANK_DURATION_MS}
                      quantize={RANK_QUANTIZE}
                      srLabel={String(ranking ?? 0)}
                    />
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <DifficultyBar
                label="Easy"
                solved={leetcodeStats?.easySolved}
                total={leetcodeStats?.totalEasy}
                color="#22c55e"
                active={leetcodeActive}
                delay={0}
              />
              <DifficultyBar
                label="Medium"
                solved={leetcodeStats?.mediumSolved}
                total={leetcodeStats?.totalMedium}
                color="#f59e0b"
                active={leetcodeActive}
                delay={BAR_STAGGER_MS}
              />
              <DifficultyBar
                label="Hard"
                solved={leetcodeStats?.hardSolved}
                total={leetcodeStats?.totalHard}
                color="#ef4444"
                active={leetcodeActive}
                delay={BAR_STAGGER_MS * 2}
              />
            </div>
          </a>

          {/* GitHub */}
          <a
            ref={githubRef}
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="stats-card glass rounded-lg p-6 card-hover text-left block"
          >
            <div className="flex items-center gap-3 mb-6">
              <Github className="h-7 w-7 text-primary" />
              <h3 className="text-xl font-semibold">GitHub Stats</h3>
            </div>

            <ul className="space-y-4 mb-6">
              {githubItems.map((item, index) => (
                <GitHubStat
                  key={item.label}
                  {...item}
                  active={githubActive}
                  // Cascade down the list rather than firing all at once.
                  delay={index * CARD_STAGGER_MS}
                />
              ))}
            </ul>

            <img
              className="w-full rounded-md"
              src={GITHUB_SUMMARY_CARD}
              alt="GitHub repositories per language"
              loading="lazy"
            />
          </a>

          {/* Certificates */}
          <article className="glass rounded-lg p-6 card-hover text-left">
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-7 w-7 text-primary" />
              <h3 className="text-xl font-semibold">Certificates</h3>
            </div>

            <ul className="space-y-3">
              {CERTIFICATES.map((cert) => {
                const Icon = CERT_ICONS[cert.icon] || Award;
                return (
                  <li key={cert.title}>
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-foreground/90 hover:text-primary transition-colors group"
                    >
                      <Icon
                        className="h-5 w-5 shrink-0"
                        style={{ color: CERT_COLORS[cert.icon] }}
                      />
                      <span className="flex-1">{cert.title}</span>
                      <ExternalLink className="h-4 w-4 opacity-60 group-hover:opacity-100 shrink-0" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

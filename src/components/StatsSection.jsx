import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { useInView } from "../hooks/useInView";
import { useReveal } from "../hooks/useReveal";
import { useCountDriver } from "../hooks/useCountDriver";
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
import SectionHeading from "./SectionHeading";
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
// Every number counts through one shared driver (useCountDriver): on first
// reveal once its data is in, on later data (from the shown value), and again
// from 0 when hovered (mouse) or tapped (touch). The ring and bars move with
// their numbers.
// Re-animate when the section scrolls back into view. Off: animate once.
const REPLAY_ON_REENTER = false;

const COUNT_DURATION_MS = 1200; // every number except the rank and ring
const RANK_DURATION_MS = 900; // the rank settles a little quicker
const RANK_QUANTIZE = 500; // rank ticks in 500s — try 100 or 1000
const RING_DURATION_MS = 900;
const STAGGER_MS = 70; // numbers within a card start this far apart

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

// One counting number. The animated text is hidden from screen readers;
// `srLabel` (or the surrounding sr-only text) carries the final figure, once.
const AnimatedNumber = ({
  value,
  active,
  delay = 0,
  duration = COUNT_DURATION_MS,
  quantize = 1,
  className,
  srLabel,
}) => {
  const [ref, handlers] = useCountDriver(value, {
    active,
    delay,
    duration,
    quantize,
  });
  const fallback = Number.isFinite(value) ? value : 0;

  return (
    <>
      <span
        ref={ref}
        aria-hidden="true"
        className={cn("stats-number", className)}
        // Hold the final width from the start so counting cannot shift layout.
        style={{ minWidth: `${String(fallback).length}ch` }}
        {...handlers}
      />
      {srLabel != null && <span className="sr-only">{srLabel}</span>}
    </>
  );
};

const CircularProgress = ({ percentage, solved, total, active, delay = 0 }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const hasValue = Number.isFinite(percentage);
  const clamped = Math.max(0, Math.min(100, percentage || 0));
  const ringRef = useRef(null);

  // The percentage counts in tenths (integers), and the ring moves with it.
  const [textRef, handlers] = useCountDriver(
    hasValue ? Math.round(clamped * 10) : null,
    {
      active,
      delay,
      duration: RING_DURATION_MS,
      format: (tenths) => `${(tenths / 10).toFixed(1)}%`,
      onValue: (tenths) =>
        ringRef.current?.setAttribute(
          "stroke-dashoffset",
          String(circumference - (tenths / 1000) * circumference),
        ),
    },
  );

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
      {...handlers}
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
        ref={ringRef}
        cx="70"
        cy="70"
        r={radius}
        strokeWidth="8"
        strokeLinecap="round"
        className="stats-ring-progress fill-none stroke-primary"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        transform="rotate(-90 70 70)"
      />
      <text
        ref={textRef}
        x="70"
        y="70"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-mono"
        fontSize="19"
        aria-hidden="true"
        style={{ fontVariantNumeric: "tabular-nums" }}
      />
    </svg>
  );
};

const DifficultyBar = ({ label, solved, total, color, active, delay }) => {
  const hasValue = Number.isFinite(solved) && Number.isFinite(total);
  const barRef = useRef(null);
  // Only the solved half counts; the bar fills with it.
  const [ref, handlers] = useCountDriver(solved, {
    active,
    delay,
    onValue: (v) => {
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${hasValue && total ? v / total : 0})`;
      }
    },
  });
  const fallback = Number.isFinite(solved) ? solved : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-2">
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          {label}
        </span>
        <span className="font-mono text-muted-foreground" {...handlers}>
          <span
            ref={ref}
            aria-hidden="true"
            className="stats-number"
            style={{ minWidth: `${String(fallback).length}ch` }}
          />
          {/* The total is shown straight away. */}
          <span aria-hidden="true"> / {total ?? 0}</span>
          <span className="sr-only">
            {solved ?? 0} of {total ?? 0} solved
          </span>
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "hsl(var(--track) / 0.6)" }}
      >
        {/* Scales rather than resizing, so the fill never triggers layout. */}
        <div
          ref={barRef}
          className="stats-bar-fill h-full w-full origin-left rounded-full"
          style={{ transform: "scaleX(0)", backgroundColor: color }}
        />
      </div>
    </div>
  );
};

const GitHubStat = ({ icon, label, value, color, active, delay }) => {
  const Icon = icon;
  return (
    <li className="flex items-center gap-3 border-b border-border py-3 first:pt-0">
      <Icon className="h-5 w-5 shrink-0" style={{ color }} aria-hidden="true" />
      <p className="flex flex-1 items-baseline justify-between gap-3 text-sm text-muted-foreground">
        {label}:{" "}
        <span className="font-mono text-xl text-foreground">
          <AnimatedNumber
            value={value}
            active={active}
            delay={delay}
            srLabel={String(value ?? 0)}
          />
        </span>
      </p>
    </li>
  );
};

const StatsSection = () => {
  const { ref: revealRef, pending: revealPending } = useReveal();
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
    <section
      id="stats"
      ref={revealRef}
      data-reveal-pending={revealPending || undefined}
      className="section-pad relative text-left"
    >
      <div className="container max-w-6xl">
        {/* <p className="text-center text-primary font-medium mb-2">
          Platforms I use
        </p>*/}
        <SectionHeading index="03" label="Stats">
          My Stats
        </SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {/* LeetCode */}
          <a
            ref={leetcodeRef}
            href={LEETCODE_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-reveal
            className="surface glass-blur stats-card card-ring rounded-xl border border-border bg-card/85 p-6 md:p-7 text-left block"
          >
            <div className="flex items-center gap-3 mb-7">
              {Si.SiLeetcode && (
                <Si.SiLeetcode className="h-7 w-7 text-primary" aria-hidden="true" />
              )}
              <h3 className="font-heading text-xl font-semibold">LeetCode Stats</h3>
            </div>

            <div className="flex items-center gap-6 mb-6">
              <CircularProgress
                percentage={solvedPct}
                solved={solved}
                total={totalQuestions}
                active={leetcodeActive}
                delay={0}
              />
              <div className="space-y-4">
                <div>
                  <p className="eyebrow text-muted-foreground">Solved</p>
                  <p className="mt-1 font-mono text-3xl text-primary">
                    <AnimatedNumber
                      value={solved}
                      active={leetcodeActive}
                      delay={0}
                      srLabel={String(solved ?? 0)}
                    />
                  </p>
                </div>
                <div>
                  <p className="eyebrow text-muted-foreground">Rank</p>
                  <p className="mt-1 font-mono text-xl text-foreground">
                    <AnimatedNumber
                      value={ranking}
                      active={leetcodeActive}
                      delay={STAGGER_MS}
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
                delay={STAGGER_MS * 2}
              />
              <DifficultyBar
                label="Medium"
                solved={leetcodeStats?.mediumSolved}
                total={leetcodeStats?.totalMedium}
                color="#f59e0b"
                active={leetcodeActive}
                delay={STAGGER_MS * 3}
              />
              <DifficultyBar
                label="Hard"
                solved={leetcodeStats?.hardSolved}
                total={leetcodeStats?.totalHard}
                color="#ef4444"
                active={leetcodeActive}
                delay={STAGGER_MS * 4}
              />
            </div>
          </a>

          {/* GitHub */}
          <a
            ref={githubRef}
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-reveal
            className="surface glass-blur stats-card card-ring rounded-xl border border-border bg-card/85 p-6 md:p-7 text-left block"
          >
            <div className="flex items-center gap-3 mb-7">
              <Github className="h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="font-heading text-xl font-semibold">GitHub Stats</h3>
            </div>

            <ul className="mb-6">
              {githubItems.map((item, index) => (
                <GitHubStat
                  key={item.label}
                  {...item}
                  active={githubActive}
                  // Cascade down the list rather than firing all at once.
                  delay={index * STAGGER_MS}
                />
              ))}
            </ul>

            <img
              className="w-full h-auto rounded-md"
              width="340"
              height="200"
              decoding="async"
              src={GITHUB_SUMMARY_CARD}
              alt="GitHub repositories per language"
              loading="lazy"
            />
          </a>

          {/* Certificates */}
          <article
            data-reveal
            className="surface glass-blur rounded-xl border border-border bg-card/85 p-6 md:p-7 text-left"
          >
            <div className="flex items-center gap-3 mb-7">
              <Award className="h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="font-heading text-xl font-semibold">Certificates</h3>
            </div>

            <ul>
              {CERTIFICATES.map((cert) => {
                const Icon = CERT_ICONS[cert.icon] || Award;
                return (
                  <li key={cert.title} className="border-b border-border last:border-b-0">
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-h-11 items-center gap-3 py-2 text-sm text-foreground hover:text-ink"
                    >
                      <Icon
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0"
                        style={{ color: CERT_COLORS[cert.icon] }}
                      />
                      <span className="flex-1">{cert.title}</span>
                      <ExternalLink className="h-4 w-4 opacity-60 group-hover:opacity-100 shrink-0" aria-hidden="true" />
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

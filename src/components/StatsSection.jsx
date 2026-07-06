import { useEffect, useState } from "react";
import {
  Award,
  Cpu,
  Database,
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
  oracle: Database, // Oracle brand icon removed from react-icons v5
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
  oracle: "#f80000",
  ibm: "#0f62fe",
  tcs: "#f58220",
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

const CircularProgress = ({ percentage }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage || 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      <circle
        cx="70"
        cy="70"
        r={radius}
        strokeWidth="8"
        className="fill-none stroke-secondary"
      />
      <circle
        cx="70"
        cy="70"
        r={radius}
        strokeWidth="8"
        strokeLinecap="round"
        className="fill-none stroke-primary"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
      <text
        x="70"
        y="70"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-semibold"
        fontSize="20"
      >
        {clamped.toFixed(1)}%
      </text>
    </svg>
  );
};

const DifficultyBar = ({ label, solved, total, color }) => {
  const pct = total ? (solved / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium" style={{ color }}>
          {label}
        </span>
        <span className="text-muted-foreground">
          {solved} / {total}
        </span>
      </div>
      <div className="w-full bg-secondary/60 h-2 rounded-full overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
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

  const solved = leetcodeStats?.totalSolved ?? 0;
  const totalQuestions = leetcodeStats?.totalQuestions ?? 0;
  const solvedPct = totalQuestions ? (solved * 100) / totalQuestions : 0;

  const githubItems = [
    {
      icon: FolderGit2,
      label: "Total Repositories",
      value: gitHubStats?.totalRepos ?? 0,
      color: GITHUB_COLORS.repos,
    },
    {
      icon: GitCommit,
      label: "Total Commits",
      value: gitHubStats?.totalCommits ?? 0,
      color: GITHUB_COLORS.commits,
    },
    {
      icon: GitPullRequest,
      label: "Total Pull Requests",
      value: gitHubStats?.totalPRs ?? 0,
      color: GITHUB_COLORS.prs,
    },
    {
      icon: Star,
      label: "Total Stars",
      value: gitHubStats?.totalStars ?? 0,
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
            href={LEETCODE_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-lg p-6 card-hover text-left block"
          >
            <div className="flex items-center gap-3 mb-6">
              {Si.SiLeetcode && (
                <Si.SiLeetcode className="h-7 w-7 text-primary" />
              )}
              <h3 className="text-xl font-semibold">LeetCode Stats</h3>
            </div>

            <div className="flex items-center gap-6 mb-6">
              <CircularProgress percentage={solvedPct} />
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Solved</p>
                  <p className="text-2xl font-bold text-primary">{solved}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rank</p>
                  <p className="text-lg font-semibold">
                    {leetcodeStats?.ranking ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <DifficultyBar
                label="Easy"
                solved={leetcodeStats?.easySolved ?? 0}
                total={leetcodeStats?.totalEasy ?? 0}
                color="#22c55e"
              />
              <DifficultyBar
                label="Medium"
                solved={leetcodeStats?.mediumSolved ?? 0}
                total={leetcodeStats?.totalMedium ?? 0}
                color="#f59e0b"
              />
              <DifficultyBar
                label="Hard"
                solved={leetcodeStats?.hardSolved ?? 0}
                total={leetcodeStats?.totalHard ?? 0}
                color="#ef4444"
              />
            </div>
          </a>

          {/* GitHub */}
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-lg p-6 card-hover text-left block"
          >
            <div className="flex items-center gap-3 mb-6">
              <Github className="h-7 w-7 text-primary" />
              <h3 className="text-xl font-semibold">GitHub Stats</h3>
            </div>

            <ul className="space-y-4 mb-6">
              {githubItems.map(({ icon: Icon, label, value, color }) => (
                <li key={label} className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" style={{ color }} />
                  <p className="text-sm">
                    {label}:{" "}
                    <span className="font-semibold text-primary">{value}</span>
                  </p>
                </li>
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

import moonmind from "../assets/moonmind.png";
import codesage from "../assets/codesage.png";
import blinkmart from "../assets/blinkmart.png";
import pingbot from "../assets/pingbot.png";
import apixi from "../assets/Capture.PNG";
import yegpt from "../assets/yegpt.png";
import tweetverse from "../assets/tweetverse.png";
import meshnode from "../assets/meshnode.png";
import defund from "../assets/defund2.png";
import selfdrvcar from "../assets/selfdrvcar.png";
import lyriks from "../assets/lyriks.png";
import recogno from "../assets/recogno.png";

export const HERO_SECTION_GREETING = "Hi, I'm";
export const HERO_SECTION_FNAME = "Ayan";
export const HERO_SECTION_LNAME = "Maiti";

// Phrases typed/erased after the greeting — one round, then it settles here.
export const HERO_SECTION_ROLES = [
  "Ayan Maiti",
  "moonman369",
  "Backend Dev",
  "AI Engineer",
  "Ayan Maiti",
];
export const HERO_SECTION_DESCRIPTION =
  "I am Ayan Maiti, currently working as a Senior Software Engineer at EY GDS, where I work as an AI Engineer building agentic orchestration solutions using Microsoft Agent Framework, Azure AI Foundry, and Azure AI services. I specialize in cloud-based systems, AI engineering, and intelligent, data-driven applications, with a strong foundation in microservices and API integrations from my previous experience at Tata Consultancy Services. Alongside my professional work, I actively build skills in artificial intelligence and adjacent technologies, with a growing focus on intelligent, data-driven systems.";

export const ABOUT_SECTION_HEADING =
  "Passionate Backend Developer & AI Engineer";

export const ABOUT_SECTION_PARAGRAPHS = [
  "I'm a Senior Software Engineer at EY GDS, currently working as an AI Engineer focused on building agentic orchestration solutions using Microsoft Agent Framework, Azure AI Foundry, and Azure AI services. I enjoy turning complex business requirements into intelligent, scalable, and maintainable systems.",
  "Outside of my day job, I'm deeply invested in AI engineering, exploring LLMs, RAG pipelines, agentic systems, and intelligent orchestration. Previously, I worked as a System Engineer at Tata Consultancy Services, where I built Azure-based integration systems, microservices, and APIs for large-scale retail clients. That experience continues to shape how I approach building reliable AI-powered software.",
];

export const ABOUT_SECTION_CARDS = [
  {
    icon: "code",
    title: "Backend & Integration",
    description:
      "Designing microservices, APIs, and event-driven integrations on Azure with a focus on reliability and scale.",
  },
  {
    icon: "cpu",
    title: "AI Engineering",
    description:
      "Building with LLMs, RAG, vector databases, and agentic frameworks to create intelligent, data-driven systems.",
  },
  {
    icon: "briefcase",
    title: "Cloud & DevOps",
    description:
      "Deploying and operating containerized workloads with Docker, Kubernetes, and Azure integration services.",
  },
];

export const SKILLS_SECTION_PROP = [
  { category: "gen-ai-ml", name: "Prompt Engineering", level: "95.6" },
  {
    category: "gen-ai-ml",
    name: "RAG (Retrieval-Augmented Generation)",
    level: "80.3",
  },
  {
    category: "gen-ai-ml",
    name: "Microsoft Agent Framework",
    level: "79.98",
  },
  {
    // Renamed from Azure AI Foundry — both names kept so it stays findable.
    category: "gen-ai-ml",
    name: "Microsoft Foundry (Azure AI Foundry)",
    level: "87.32",
  },
  {
    category: "gen-ai-ml",
    name: "LangGraph",
    level: "82.4",
  },
  {
    category: "gen-ai-ml",
    name: "Agentic Orchestration",
    level: "85.6",
  },
  {
    category: "gen-ai-ml",
    name: "Agentic Graph Workflows",
    level: "88.28",
  },
  {
    category: "gen-ai-ml",
    name: "Vector DB (Qdrant, Weaviate)",
    level: "80.4",
  },
  { category: "gen-ai-ml", name: "LangChain", level: "60.5" },
  { category: "gen-ai-ml", name: "OpenAI / LLM APIs", level: "95.7" },
  {
    category: "gen-ai-ml",
    name: "MCP (Model Context Protocol)",
    level: "80.4",
  },
  { category: "backend", name: "Java", level: "98.9" },
  { category: "backend", name: "SpringBoot", level: "98.4" },
  { category: "backend", name: "Python", level: "97.6" },
  { category: "backend", name: "NodeJS", level: "98.5" },
  { category: "backend", name: "SQL", level: "68.4" },
  { category: "backend", name: "MongoDB", level: "88.8" },
  { category: "backend", name: "ExpressJS", level: "96.4" },
  { category: "backend", name: "Mulesoft", level: "60.2" },
  { category: "backend", name: ".NET", level: "98.9" },
  { category: "frontend", name: "HTML5", level: "85.5" },
  { category: "frontend", name: "CSS3", level: "76" },
  { category: "frontend", name: "JavaScript", level: "95.6" },
  { category: "frontend", name: "TypeScript", level: "90.2" },
  { category: "frontend", name: "ReactJS", level: "95.4" },
  { category: "frontend", name: "NextJS", level: "93.8" },
  { category: "frontend", name: "Vite", level: "91.3" },
  { category: "frontend", name: "TailwindCSS", level: "90.5" },
  { category: "frontend", name: "Redux", level: "80.4" },
  { category: "cloud-web3", name: "Azure Integration Services", level: "97.3" },
  { category: "cloud-web3", name: "Azure Functions", level: "98" },
  { category: "cloud-web3", name: "Azure Kubernetes Service", level: "80" },
  { category: "cloud-web3", name: "Docker", level: "95.3" },
  { category: "cloud-web3", name: "Solidity", level: "82" },
  { category: "cloud-web3", name: "EVM Blockchains", level: "60" },
  { category: "cloud-web3", name: "Chainlink", level: "60" },
];

// Human-friendly labels for the skill category filter.
export const SKILL_CATEGORY_LABELS = {
  all: "All",
  "gen-ai-ml": "GenAI / ML",
  backend: "Backend",
  frontend: "Frontend",
  "cloud-web3": "Cloud / Web3",
};

export const PROJECTS = [
  {
    id: 0,
    image: recogno,
    title: "Recogno: AI Powered DSA Pattern Recognition and Spaced Repetition Engine",
    github: "https://github.com/moonman369/recogno-ui",
    // Internal route — opens the in-app Moonmind chat page.
    demo: "https://recogno.moonman.in/",
  },
  {
    id: 1,
    image: moonmind,
    title: "Moonmind AI: AI Powered Professional Portfolio Assistant",
    github: "https://github.com/moonman369/Portfolio-Stats-API",
    // Internal route — opens the in-app Moonmind chat page.
    demo: "/moonmind",
  },
  {
    id: 2,
    image: codesage,
    title: "CodeSage: AI powered code navigator (Under development)",
    github: "https://github.com/moonman369/CodeSage-Service",
    demo: "https://www.linkedin.com/search/results/content/?fromMember=%5B%22ACoAADo_V9gBWpUhotMGBIKss3IypOU4FPK0Q3E%22%5D&keywords=%23codesage&origin=FACETED_SEARCH&sid=3%3B)&sortBy=%22date_posted%22",
  },
  {
    id: 3,
    image: blinkmart,
    title: "BlinkMart - Fully Functional Quick Commerce Platform",
    github: "https://github.com/moonman369/BlinkMart-Client",
    demo: "https://blinkmart.projects.moonman.in",
  },
  {
    id: 4,
    image: pingbot,
    title: "Ping-Bot-v0: Golang based AI Discord Chat Bot",
    github: "https://github.com/moonman369/Go-Discord-Bot",
    demo: "https://top.gg/bot/1134185454502170694",
  },
  {
    id: 5,
    image: apixi,
    title: "Apixi: AI Image generator and Sharing platform (uses Dall-E)",
    github: "https://github.com/moonman369/ApixiClient",
    demo: "https://apixi.vercel.app/",
  },
  {
    id: 6,
    image: yegpt,
    title: "YeGPT - GPT-4 based Kanye West Chatbot",
    github: "https://github.com/moonman369/YeGPT",
    demo: "https://yegpt.vercel.app/",
  },
  {
    id: 7,
    image: tweetverse,
    title:
      "TweetVerse - A Decentralized Twitter Clone with Web2.0 authorization support.",
    github: "https://github.com/moonman369/TweetVerse",
    demo: "https://tweetverse.vercel.app/",
  },
  {
    id: 8,
    image: meshnode,
    title:
      "MeshNode - Decentralized Q&A Platform (Chainlink Hackathon Project)",
    github: "https://github.com/moonman369/MeshNode",
    demo: "https://mesh-node.vercel.app/",
  },
  {
    id: 9,
    image: defund,
    title: "DeFund: Decentralized Crowdfunding",
    github: "https://github.com/moonman369/DeFund",
    demo: "https://defund.netlify.app/",
  },
  {
    id: 10,
    image: selfdrvcar,
    title: "AI Based Self Driving Car",
    github: "https://github.com/moonman369/Self-Driving-AI-Car",
    demo: "https://github.com/moonman369/Self-Driving-AI-Car",
  },
  {
    id: 11,
    image: lyriks,
    title: "Lyriks - Spotify Clone",
    github: "https://github.com/moonman369/Lyrikx-Music",
    demo: "https://lyriks1.netlify.app/",
  },
];

export const GITHUB_USERNAME = "moonman369";
export const GITHUB_URL = `https://github.com/${GITHUB_USERNAME}`;

// Résumé is served from an external (e.g. Google Drive) link via env.
export const RESUME_URL = import.meta.env.VITE_RESUME_URL || "#";

export const CONTACT_INFO = {
  email: "mightyayan369@gmail.com",
  phone: "",
  location: "Kolkata, West Bengal, India",
  locationUrl: "https://maps.app.goo.gl/Vd8vryBJy3d7xpg86",
};

export const SOCIAL_LINKS = [
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/ayan-maiti-5b4332233/",
    icon: "linkedin",
  },
  { name: "GitHub", url: "https://github.com/moonman369", icon: "github" },
  {
    name: "LeetCode",
    url: "https://leetcode.com/u/moonman369/",
    icon: "leetcode",
  },
  {
    name: "WhatsApp",
    url: "https://api.whatsapp.com/send?phone=919830225282",
    icon: "whatsapp",
  },
  { name: "Mail", url: "mailto:mightyayan369@gmail.com", icon: "mail" },
];

// Certificates rendered in the Stats section. `icon` maps to a brand icon
// resolved in StatsSection.jsx; `url` opens in a new tab.
export const CERTIFICATES = [
  {
    icon: "claude",
    title: "Claude Certified Developer",
    url: "https://drive.google.com/file/d/14w6_9ETaFyosMltrd30Ed6IhOvthBbiX/view?usp=sharing",
  },
  {
    icon: "oracle",
    title: "OCI – Gen AI Professional",
    url: "https://drive.google.com/file/d/1s3i9218hfue91ELClDyhXQqNdj2c7YNG/view?usp=sharing",
  },
  {
    icon: "tcs",
    title: "TCS AI Friday",
    url: "https://drive.google.com/file/d/1mVyzjpfoyj5GLRr0HvWYuOcyJW6e8-6V/view?usp=sharing",
  },
  {
    icon: "coursera",
    title: "Coursera + DeepLearningAI: RAG",
    url: "https://drive.google.com/file/d/1wHW1TsoHb5if_-0FhLxyj6m0ZYOEDkWz/view?usp=sharing",
  },
  {
    icon: "ibm",
    title: "IBM, Gen AI for SDE",
    url: "https://coursera.org/share/9289ae0ffdf337597952f42d48f48924",
  },
  {
    icon: "azure",
    title: "Microsoft AZ-900 Certification",
    url: "https://drive.google.com/file/d/1zz9vJ3r2AzDdWC6fPUIjqWRv_RYGvjyE/view?usp=sharing",
  },
  {
    icon: "intern",
    title: "Internship, W3 Dev Private Limited",
    url: "https://drive.google.com/file/d/1BPcUwBleZGfb2CM5jZ7NM4MyX3EQo4Xg/view?usp=sharing",
  },
  {
    icon: "block",
    title: "Blockchain Course, Udemy",
    url: "https://drive.google.com/file/d/1vssY0bkRWdwDYN4zfTTFFGO5UIwgJwB8/view?usp=share_link",
  },
  {
    icon: "google",
    title: "Google, Crash Course on Python",
    url: "https://drive.google.com/file/d/1tnS2bd_6f_PDUB8J4xePtsIpWVTIYjRN/view?usp=sharing",
  },
];

// ---- Hero moon ↔ moonman369 (round 4) ----
// The handle shown as the hero's identity line, above the name.
export const HERO_SECTION_HANDLE = "moonman369";

// Lunar phase names, in cycle order from new moon.
export const MOON_PHASE_NAMES = [
  "new moon",
  "waxing crescent",
  "first quarter",
  "waxing gibbous",
  "full moon",
  "waning gibbous",
  "last quarter",
  "waning crescent",
];
// The caption under the hero moon. {phase} is a name from MOON_PHASE_NAMES,
// {lit} the illuminated percentage.
export const MOON_CAPTION_TODAY = "today · {phase} · {lit}% lit";
export const MOON_CAPTION_VIEWING = "viewing · {phase}";
// Shown under the caption until the first interaction of the visit.
export const MOON_DRAG_HINT = "drag the moon";
export const MOON_BACK_TO_TODAY = "back to today";

// ---- Moonmind discoverability (round 4) ----
// Tappable starter questions under the greeting of an empty chat; each is
// sent exactly as if typed.
export const MOONMIND_STARTERS = [
  "Who are you?",
  "Tell me something about Ayan",
  "Share all of Ayan's profile links and his résumé",
  "Show me Ayan's LeetCode and GitHub stats",
];
export const MOONMIND_STARTERS_LABEL = "Suggested questions";
// Visible label on the navbar pill, the bottom-nav centre button and the
// hero button, and the accessible name that goes with it.
export const MOONMIND_ASK_LABEL = "Ask Moonmind";
export const MOONMIND_ASK_ARIA_LABEL = "Ask Moonmind, AI assistant";
// Second, smaller line on the hero button (hidden below 360px).
export const HERO_MOONMIND_SUBLABEL = "my AI assistant";
// The once-per-visit nudge bubble by the Moonmind entry point.
export const MOONMIND_NUDGE_TEXT = "Ask me anything about Ayan";
export const MOONMIND_NUDGE_STARTERS = MOONMIND_STARTERS.slice(0, 2);
export const MOONMIND_NUDGE_CLOSE_LABEL = "Dismiss Moonmind suggestion";

// ---- Shorter hero (round 4) ----
// A short line in the hero in place of HERO_SECTION_DESCRIPTION (kept
// above; the full detail lives in About). Keep it to about two lines on a
// phone so both hero buttons stay above the fold.
export const HERO_SECTION_TAGLINE =
  "Senior Software Engineer at EY GDS, building agentic AI systems with Microsoft Agent Framework and Azure AI Foundry.";

// ---- Moonmind intro pop-up (shown on every load by the Moonmind button) ----
export const MOONMIND_INTRO_TITLE = "Moonmind AI";
export const MOONMIND_INTRO_TAG = "Ayan's portfolio assistant";
export const MOONMIND_INTRO_TEXT =
  "Ask me anything about Ayan's projects, skills and experience.";
// How long it stays before going by itself (paused while hovered/focused).
export const MOONMIND_INTRO_MS = 7000;

// ---- Phone hero (round 5) ----
// Short moon captions for screens under 400px wide: the same states as
// MOON_CAPTION_TODAY / MOON_CAPTION_VIEWING without their first word (and
// "lit"), so they stay on one line beside the name.
export const MOON_CAPTION_TODAY_SHORT = "{phase} · {lit}%";
export const MOON_CAPTION_VIEWING_SHORT = "{phase}";
// Short label for the résumé button when the two hero buttons share a row
// on a phone; "Download Résumé" shows everywhere else.
export const HERO_CTA_RESUME_SHORT = "Résumé";
// Accessible name of the hero résumé button (contains either visible label).
export const HERO_CTA_RESUME_ARIA_LABEL = "Download résumé";

// ---- Shorter Projects list on phones (round 5) ----
// Under 640px the Projects grid shows this many cards (in PROJECTS order)
// and a button for the rest; from 640px every project shows.
export const PROJECTS_MOBILE_INITIAL_COUNT = 6;
// {count} is the number of hidden projects.
export const PROJECTS_SHOW_MORE_LABEL = "Show {count} more projects";
export const PROJECTS_SHOW_FEWER_LABEL = "Show fewer projects";
// Announced (politely) when the hidden projects are shown.
export const PROJECTS_SHOWN_ANNOUNCEMENT = "{count} more projects shown";

// ---- Moonmind chat redesign ----
// Header subtitle: the full line where it fits, the short one where it would
// otherwise be cut off (narrow headers).
export const MOONMIND_SUBTITLE = "Ayan's portfolio assistant";
export const MOONMIND_SUBTITLE_SHORT = "AI assistant";
// The message list (role="log") and its pill for answers that arrived while
// the reader was scrolled up.
export const MOONMIND_LOG_LABEL = "Conversation";
export const MOONMIND_JUMP_LATEST = "Jump to latest";
// Per-answer copy action.
export const MOONMIND_COPY_LABEL = "Copy answer";
export const MOONMIND_COPIED = "Copied";
// Visually hidden status: what a screen reader hears while a run is going,
// instead of every step update.
export const MOONMIND_STATUS_WORKING = "Working…";
export const MOONMIND_STATUS_READY = "Answer ready";
// Shown under the trace only when a run is slow: the first after 6s, replaced
// by the second after 20s.
export const MOONMIND_WAIT_SLOW = "Still working. Searching takes a few seconds.";
export const MOONMIND_WAIT_LONG = "This is taking longer than usual.";
// Under a failed answer: resends the last question.
export const MOONMIND_TRY_AGAIN = "Try again";
// Route chip after a run: plain words for the backend's route names. A
// route missing here shows its raw name (the raw name is always the chip's
// title). `tech_web` is the retired alias of `agent`.
export const MOONMIND_ROUTE_LABELS = {
  knowledge: "From the portfolio",
  agent: "Researched",
  tech_web: "Researched",
  stats: "Live stats",
  capabilities: "About Moonmind",
  greeting: "Greeting",
  refusal: "Out of scope",
};
// The disclosure inside the expanded trace that shows the sub-steps.
export const MOONMIND_DETAILS_LABEL = "Details";

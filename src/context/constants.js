import moonmind from "../assets/moonmind.png";
import codesage from "../assets/codesage.png";
import blinkmart from "../assets/blinkmart.png";
import pingbot from "../assets/pingbot.png";
import apixi from "../assets/Capture.PNG";
import yegpt from "../assets/yegpt.png";
import tweetverse from "../assets/tweetverse.png";
import meshnode from "../assets/meshnode.png";
import avaxgods from "../assets/avaxgods.png";
import defund from "../assets/defund2.png";
import selfdrvcar from "../assets/selfdrvcar.png";
import lyriks from "../assets/lyriks.png";

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
  "I am Ayan Maiti, currently working as a System Engineer at Tata Consultancy Services Limited. I specialize in Azure-based systems, microservices, and API integrations, with hands-on experience in the retail domain. Alongside my professional work, I actively build skills in artificial intelligence and adjacent technologies, with a growing focus on intelligent, data-driven systems.";

export const ABOUT_SECTION_HEADING =
  "Passionate Backend Developer & AI Engineer";

export const ABOUT_SECTION_PARAGRAPHS = [
  "I'm a System Engineer at Tata Consultancy Services, where I design and ship Azure-based integration systems, microservices, and APIs for large-scale retail clients. I enjoy turning complex business requirements into reliable, maintainable services.",
  "Outside of my day job I'm deeply invested in AI engineering — building with LLMs, RAG pipelines, and agentic systems. I'm always exploring how intelligent, data-driven tooling can make software more useful, and I love learning new corners of the stack along the way.",
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
      "Building with LLMs, RAG, vector databases, and agentic workflows to create intelligent, data-driven systems.",
  },
  {
    icon: "briefcase",
    title: "Cloud & DevOps",
    description:
      "Deploying and operating containerized workloads with Docker, Kubernetes, and Azure integration services.",
  },
];

export const SKILLS_SECTION_PROP = [
  { category: "backend", name: "Java", level: "98.9" },
  { category: "backend", name: "SpringBoot", level: "98.4" },
  { category: "backend", name: "Python", level: "97.6" },
  { category: "backend", name: "NodeJS", level: "98.5" },
  { category: "backend", name: "SQL", level: "68.4" },
  { category: "backend", name: "MongoDB", level: "88.8" },
  { category: "backend", name: "ExpressJS", level: "96.4" },
  { category: "backend", name: "Mulesoft", level: "60.2" },
  { category: "backend", name: ".NET", level: "98.9" },
  { category: "gen-ai-ml", name: "Prompt Engineering", level: "95.6" },
  {
    category: "gen-ai-ml",
    name: "RAG (Retrieval-Augmented Generation)",
    level: "80.3",
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
  backend: "Backend",
  "gen-ai-ml": "GenAI / ML",
  frontend: "Frontend",
  "cloud-web3": "Cloud / Web3",
};

export const PROJECTS = [
  {
    id: 0,
    image: moonmind,
    title: "Moonmind AI: AI Powered Professional Portfolio Assistant",
    github: "https://github.com/moonman369/Portfolio-Stats-API",
    demo: "https://moonman.in",
  },
  {
    id: 1,
    image: codesage,
    title: "CodeSage: AI powered code navigator (Under development)",
    github: "https://github.com/moonman369/CodeSage-Service",
    demo: "https://www.linkedin.com/search/results/content/?fromMember=%5B%22ACoAADo_V9gBWpUhotMGBIKss3IypOU4FPK0Q3E%22%5D&keywords=%23codesage&origin=FACETED_SEARCH&sid=3%3B)&sortBy=%22date_posted%22",
  },
  {
    id: 2,
    image: blinkmart,
    title: "BlinkMart - Fully Functional Quick Commerce Platform",
    github: "https://github.com/moonman369/BlinkMart-Client",
    demo: "https://blinkmart.projects.moonman.in",
  },
  {
    id: 3,
    image: pingbot,
    title: "Ping-Bot-v0: Golang based AI Discord Chat Bot",
    github: "https://github.com/moonman369/Go-Discord-Bot",
    demo: "https://top.gg/bot/1134185454502170694",
  },
  {
    id: 4,
    image: apixi,
    title: "Apixi: AI Image generator and Sharing platform (uses Dall-E)",
    github: "https://github.com/moonman369/ApixiClient",
    demo: "https://apixi.vercel.app/",
  },
  {
    id: 5,
    image: yegpt,
    title: "YeGPT - GPT-4 based Kanye West Chatbot",
    github: "https://github.com/moonman369/YeGPT",
    demo: "https://yegpt.vercel.app/",
  },
  {
    id: 6,
    image: tweetverse,
    title:
      "TweetVerse - A Decentralized Twitter Clone with Web2.0 authorization support.",
    github: "https://github.com/moonman369/TweetVerse",
    demo: "https://tweetverse.vercel.app/",
  },
  {
    id: 7,
    image: meshnode,
    title:
      "MeshNode - Decentralized Q&A Platform (Chainlink Hackathon Project)",
    github: "https://github.com/moonman369/MeshNode",
    demo: "https://mesh-node.vercel.app/",
  },
  {
    id: 8,
    image: avaxgods,
    title: "AVAX Gods - NFT Card Game",
    github: "https://github.com/moonman369/AVAX-Gods-Frontend",
    demo: "https://avaxgodsonline.netlify.app/",
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

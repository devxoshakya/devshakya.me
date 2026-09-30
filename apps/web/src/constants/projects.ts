import { SITE } from "@/constants/site";
import type {
  Project,
  ProjectSource,
  ProjectSourceOption,
} from "@/types/projects";

export const HOME_FEATURED_PROJECT_COUNT = 4 as const;

export const PROJECT_SOURCES = [
  {
    image: SITE.AUTHOR.AVATAR,
    label: "Personal",
    value: "personal",
  },
  {
    image: SITE.AUTHOR.FREELANCE_AVATAR,
    label: "Freelance",
    value: "freelance",
  },
] as const satisfies readonly ProjectSourceOption[];

export const DEFAULT_PROJECT_SOURCE: ProjectSource = "personal";

export const PROJECTS = [
  {
    category: "Product",
    date: {
      month: "March",
      year: 2026,
    },
    description:
      "A RAG-powered academic SaaS platform that automates result analysis for AKTU-affiliated colleges.",
    featured: true,
    image: "/images/project/Space.png",
    links: {
      github: "https://github.com/devxoshakya/singularity",
      website: "https://s.devxoshakya.xyz/",
    },
    slug: "singularity",
    source: "personal",
    tags: [
      "Next.js",
      "FastAPI",
      "Cloudflare Workers",
      "MongoDB",
      "Prisma",
      "Clerk",
    ],
    tagline:
      "A RAG-powered academic SaaS platform that automates result analysis for AKTU-affiliated colleges.",
    timeline: "Mar. 2026 - Present",
    title: "Singularity.",
    videoSrc: "https://cdn2.devxoshakya.xyz/folio/singularity.webm",
  },
  {
    category: "Product",
    date: {
      month: "May",
      year: 2025,
    },
    description:
      "Anveshna is an anime streaming website that lets you watch your favorite anime, powered by a scalable backend and streaming API.",
    featured: true,
    image: "/images/project/Space.png",
    links: {
      github: "https://github.com/devxoshakya/anveshna",
      website: "https://anveshna.devxoshakya.xyz/",
    },
    slug: "anveshna",
    source: "personal",
    tags: [
      "Next.js",
      "Bun",
      "Hono",
      "Docker",
      "GCP Cloud Run",
      "HLS Streaming",
    ],
    tagline:
      "Anveshna is an anime streaming website that lets you watch your favorite anime, powered by a scalable backend and streaming API.",
    timeline: "Apr. 2026 - June 2026",
    title: "Anveshna.",
    videoSrc: "https://cdn2.devxoshakya.xyz/folio/anveshna.webm",
  },
  {
    category: "Product",
    date: { month: "April", year: 2026 },
    description:
      "A premium skincare website with editorial design, Cloudflare asset delivery, and SEO-focused implementation.",
    featured: true,
    links: {
      github: "https://github.com/devxoshakya/aviha",
      website: "https://theaviha.com/",
    },
    slug: "aviha",
    source: "freelance",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Cloudflare Pages", "CDN", "SEO"],
    tagline:
      "A premium skincare website with editorial design, Cloudflare asset delivery, and SEO-focused implementation.",
    timeline: "April 2026",
    title: "Aviha",
    videoSrc: "https://cdn2.devxoshakya.xyz/folio/aviha.webm",
  },
  {
    category: "Product",
    date: { month: "April", year: 2025 },
    description:
      "A landing page for MP Pharmaceuticals Group’s 3rd-party pharmaceuticals business with chatbot integration.",
    featured: true,
    links: {
      github: "https://github.com/devxoshakya/mp-pharma",
      website: "https://mppharmaceuticals.com/",
    },
    slug: "mp-pharmaceuticals",
    source: "freelance",
    tags: ["Next.js", "Cloudflare Worker", "R2 Storage", "CDN", "Gemini SDK"],
    tagline:
      "A landing page for MP Pharmaceuticals Group’s 3rd-party pharmaceuticals business with chatbot integration.",
    timeline: "April 2025 - June 2025",
    title: "MP Pharmaceuticals Group of Co.",
    videoSrc: "https://cdn2.devxoshakya.xyz/folio/mppharma.webm",
  },
] satisfies readonly Project[];

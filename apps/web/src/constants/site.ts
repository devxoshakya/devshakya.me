import type { NavItem } from "@/types/nav";

import { ROUTES } from "./routes";
import { getBaseUrl } from "./url";
import { NAME, USER } from "./user";

const baseUrl = getBaseUrl();

export const SITE = {
    AUTHOR: {
        AVATAR: USER.avatar,
        FREELANCE_AVATAR: "https://cdn2.devxoshakya.xyz/folio/1763300070977.jpeg",
        NAME,
        TWITTER: "@devxoshakya",
    },
    DESCRIPTION: {
        LONG: "Software engineer based in India. I build fast, thoughtful products across frontend systems, backend infrastructure, AI, and the web.",
        SHORT:
            "Software engineer building fast, thoughtful products across frontend systems, backend infrastructure, AI, and the web.",
    },
    KEYWORDS: [
        "Dev Shakya",
        "Software Engineer",
        "Product Builder",
        "Frontend Engineer",
        "React Developer",
        "Next.js",
        "Tailwind CSS",
        "UI/UX Design",
        "Design Engineering",
        "Web Development",
        "Portfolio",
    ],
    NAME,
    URL: baseUrl,
} as const;

export const META_THEME_COLORS = {
    dark: "#0a0a0a",
    light: "#ffffff",
};

export const UTM_PARAMS = {
    utm_source: new URL(baseUrl).hostname,
};

export const NAV_STANDALONE: NavItem[] = [
    {
        href: ROUTES.HOME,
        id: "home",
        label: "home",
    },
];

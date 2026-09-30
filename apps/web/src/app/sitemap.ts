import type { MetadataRoute } from "next";

import { ROUTES } from "@/constants/routes";
import { SITE } from "@/constants/site";
import { absoluteUrl } from "@/lib/utils";

const PRIORITY = {
    HOME: 1,
    INDEX: 0.9,
    PRIMARY: 0.8,
    SECONDARY: 0.7,
} as const;

type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

type SitemapEntry = MetadataRoute.Sitemap[number];

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    const entry = (url: string, priority: Priority): SitemapEntry => ({
        changeFrequency: "monthly",
        lastModified,
        priority,
        url,
    });

    const routeEntry = (route: string, priority: Priority): SitemapEntry =>
        entry(absoluteUrl(route), priority);

    return [
        entry(SITE.URL, PRIORITY.HOME),

        routeEntry(ROUTES.ABOUT, PRIORITY.INDEX),
        routeEntry(ROUTES.BLOG, PRIORITY.INDEX),
        routeEntry(ROUTES.PINS, PRIORITY.INDEX),
    ];
}

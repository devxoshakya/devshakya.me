import type { MetadataRoute } from "next";
import fs from "fs";
import matter from "gray-matter";

import { ROUTES } from "@/constants/routes";
import { SITE } from "@/constants/site";
import { getFiles } from "@/lib/mdx";
import { absoluteUrl } from "@/lib/utils";

const PRIORITY = {
    HOME: 1,
    INDEX: 0.9,
    PRIMARY: 0.8,
    SECONDARY: 0.7,
} as const;

type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

type SitemapEntry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const lastModified = new Date();

    const entry = (url: string, priority: Priority): SitemapEntry => ({
        changeFrequency: "monthly",
        lastModified,
        priority,
        url,
    });

    const routeEntry = (route: string, priority: Priority): SitemapEntry =>
        entry(absoluteUrl(route), priority);

    const blogPosts: MetadataRoute.Sitemap = (await getFiles("blog")).flatMap(
        (file) => {
            const { data } = matter(
                fs.readFileSync(
                    `${process.cwd()}/data/blog/${file}`,
                    "utf8",
                ),
            );
            const slug = file.replace(/\.mdx$/, "");

            return [
                {
                    changeFrequency: "monthly" as const,
                    lastModified: data.publishedAt
                        ? new Date(data.publishedAt as string)
                        : lastModified,
                    priority: PRIORITY.SECONDARY,
                    url: absoluteUrl(`/blog/${slug}`),
                },
            ];
        },
    );

    return [
        entry(SITE.URL, PRIORITY.HOME),

        routeEntry(ROUTES.ABOUT, PRIORITY.INDEX),
        routeEntry(ROUTES.BLOG, PRIORITY.INDEX),
        routeEntry(ROUTES.PINS, PRIORITY.INDEX),

        ...blogPosts,
    ];
}

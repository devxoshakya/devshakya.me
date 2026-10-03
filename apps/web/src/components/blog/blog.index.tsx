"use client";

import { useMemo, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import BlurFade from "@/components/project/blur-fade";
import { BlogPostLink } from "./blog-post-link";
import { cn } from "@/lib/utils";

const BLUR_FADE_DELAY = 0.04;

export type BlogIndexPost = {
    slug: string;
    title: string;
    publishedAt: string;
    summary?: string;
};

type BlogIndexProps = {
    posts: BlogIndexPost[];
};

export function BlogIndex({ posts }: BlogIndexProps) {
    const [query, setQuery] = useState("");

    const sorted = useMemo(
        () =>
            [...posts].sort(
                (a, b) =>
                    new Date(b.publishedAt).getTime() -
                    new Date(a.publishedAt).getTime(),
            ),
        [posts],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return sorted;
        return sorted.filter((p) => p.title.toLowerCase().includes(q));
    }, [sorted, query]);

    return (
        <section className="mt-6 flex flex-col gap-6">
            <BlurFade delay={BLUR_FADE_DELAY}>
                <div className="relative">
                    <label htmlFor="blog-search" className="sr-only">
                        Search posts by title
                    </label>
                    <IconSearch
                        className="text-foreground/40 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                        aria-hidden
                    />
                    <input
                        id="blog-search"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Filter by title…"
                        className={cn(
                            "w-full rounded-md border border-border bg-background py-2.5 pr-3 pl-10 text-sm text-foreground",
                            "placeholder:text-foreground/40",
                            "focus:border-ring focus:ring-ring focus:ring-1 focus:outline-none",
                        )}
                        autoComplete="off"
                    />
                </div>
            </BlurFade>

            <div>
                {!filtered.length ? (
                    <p className="text-foreground/70 text-sm">
                        No posts match that filter.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-4">
                        {filtered.map((post, index) => (
                            <li key={post.slug}>
                                <BlurFade
                                    delay={BLUR_FADE_DELAY * 2 + index * 0.05}
                                >
                                    <BlogPostLink
                                        title={post.title}
                                        slug={post.slug}
                                        publishedAt={post.publishedAt}
                                    />
                                </BlurFade>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

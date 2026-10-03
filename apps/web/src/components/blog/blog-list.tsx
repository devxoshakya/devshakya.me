"use client";
import Link from "next/link";
import { formatPostDate } from "@/lib/format-post-date";
import BlurFade from "@/components/project/blur-fade";
import { Title } from "@devshakya.me/ui/components/title";
import type { Route } from "next";

export type BlogListPost = {
    slug: string;
    title: string;
    summary?: string;
    publishedAt: string;
};

export const BlogList = ({ posts }: { posts: BlogListPost[] }) => {
    return (
        <div className="group grid grid-cols-1 divide-y divide-border">
            {posts.slice(0, 3).map((post, index) => (
                <BlurFade key={post.slug} delay={index * 0.05}>
                    <article className="w-full space-y-1 py-4 transition-[border-color,opacity] duration-50 hover:opacity-100 group-hover:opacity-30">
                        <div className="flex items-center justify-between gap-4">
                            <Title
                                className="min-w-0 flex-1 font-sans text-base font-normal"
                                render={
                                    <h3>
                                        <Link
                                            href={`/blog/${post.slug}` as Route}
                                            className="block truncate underline-offset-4 hover:underline"
                                        >
                                            {post.title}
                                        </Link>
                                    </h3>
                                }
                            />
                            <span className="text-muted-foreground shrink-0 font-mono text-xs font-normal">
                                {formatPostDate(post.publishedAt)}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm font-normal">
                            {post.summary}
                        </p>
                    </article>
                </BlurFade>
            ))}
        </div>
    );
};

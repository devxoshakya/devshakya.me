import type { Metadata } from "next";
import Container from "@/components/container";
import { BlogIndex, type BlogIndexPost } from "@/components/blog/blog.index";
import { getAllFilesFrontMatter } from "@/lib/mdx";
import { Section } from "@devshakya.me/ui/components/section";
import { Title } from "@devshakya.me/ui/components/title";
import { CopyLink } from "@/components/copy-link";
import BlurFade from "@/components/project/blur-fade";

export const metadata: Metadata = {
    title: "Blog - Manu Arora",
    description:
        "Notes on software, design engineering, freelancing, and things I learn while building.",
    alternates: {
        canonical: "/blog",
    },
};

export default async function BlogPage() {
    const posts = (await getAllFilesFrontMatter(
        "blog",
    )) as unknown as BlogIndexPost[];

    return (
        <Section id="blog">
            <BlurFade delay={0.04}>
                <span className="group/social flex items-center gap-1">
                    <Title
                        className="text-xl ml-4 font-medium italic"
                        render={<h2>{"blogs."}</h2>}
                    />
                    <CopyLink
                        title={"pins"}
                        className="hidden group-hover/social:inline-flex"
                    />
                </span>
            </BlurFade>
            <Container className="min-h-screen">
                <BlurFade delay={0.08}>
                    <p className="text-foreground pt-4 text-base">
                        I usually rearrange 0s and 1s for a living, and ocasionally
                        write my thoughts and learnings here.
                    </p>
                </BlurFade>
                <BlogIndex posts={posts} />
            </Container>
        </Section>
    );
}

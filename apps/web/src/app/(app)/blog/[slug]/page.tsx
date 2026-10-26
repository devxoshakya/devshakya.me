import type { Metadata } from "next";
import { getFiles, getFileBySlug } from "@/lib/mdx";
import { SITE } from "@/constants/site";
import { existsSync } from "fs";
import { join } from "path";
import { getOgImageUrl } from "@/seo/metadata";
import { BlogPostingJsonLd, BreadcrumbJsonLd } from "@/seo/json-id";
import BlogPostClient from "./BlogPostClient";

const siteUrl = SITE.URL;

type PostFrontMatter = {
    title: string;
    publishedAt: string;
    summary?: string;
    image?: string;
    readingTime?: { text: string };
};

const resolveOgImage = (
    image: string | undefined,
    title: string,
    summary?: string,
): string => {
    if (image?.startsWith("http")) {
        return image;
    }

    // Only use bundled images that actually exist in /public (avoid 404 OG images).
    if (
        image &&
        existsSync(join(process.cwd(), "public", image.replace(/^\//, "")))
    ) {
        return `${siteUrl}${image}`;
    }

    // Fallback to the generated OG image.
    return getOgImageUrl(title, summary, "article");
};

export async function generateStaticParams() {
    const posts = await getFiles("blog");
    return posts.map((p) => ({
        slug: p.replace(/\.mdx/, ""),
    }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const post = await getFileBySlug("blog", slug);
    const { title, summary, publishedAt, image } =
        post.frontMatter as unknown as PostFrontMatter;

    const ogImage = resolveOgImage(image, title, summary);

    return {
        title,
        description: summary,
        alternates: {
            canonical: `/blog/${slug}`,
        },
        openGraph: {
            title,
            description: summary,
            type: "article",
            url: `${siteUrl}/blog/${slug}`,
            ...(publishedAt ? { publishedTime: publishedAt } : {}),
            images: [
                {
                    alt: title,
                    height: 630,
                    url: ogImage,
                    width: 1200,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: summary,
            images: [
                {
                    alt: title,
                    height: 630,
                    url: ogImage,
                    width: 1200,
                },
            ],
        },
    };
}

export default async function BlogSlugPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = await getFileBySlug("blog", slug);
    const { title, summary, publishedAt, image } =
        post.frontMatter as unknown as PostFrontMatter;
    const postUrl = `${siteUrl}/blog/${slug}`;
    const ogImage = resolveOgImage(image, title, summary);

    return (
        <>
            <BreadcrumbJsonLd
                items={[
                    { name: "Home", path: "/" },
                    { name: "Blog", path: "/blog" },
                    { name: title, path: `/blog/${slug}` },
                ]}
            />
            <BlogPostingJsonLd
                title={title}
                description={summary}
                url={postUrl}
                image={ogImage}
                datePublished={publishedAt}
            />
            <BlogPostClient
                mdxSource={post.mdxSource}
                frontMatter={post.frontMatter as unknown as PostFrontMatter}
            />
        </>
    );
}

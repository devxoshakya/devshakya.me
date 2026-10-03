import { Section } from "@devshakya.me/ui/components/section";
import { Title } from "@devshakya.me/ui/components/title";

import { CopyLink } from "@/components/copy-link";
import { getAllFilesFrontMatter } from "@/lib/mdx";

import { BlogList, type BlogListPost } from "./blog-list";

const WritingSection = async () => {
    const posts = (await getAllFilesFrontMatter(
        "blog",
    )) as unknown as BlogListPost[];

    return (
        <Section className="flex flex-col gap-4" id="writing">
            <div className="group/writing flex items-center gap-1">
                <Title
                    className="text-xl font-medium italic"
                    render={<h2>writings.</h2>}
                />
                <CopyLink
                    title="Writing"
                    className="hidden group-hover/writing:inline-flex"
                />
            </div>
            <BlogList posts={posts} />
        </Section>
    );
};

export { WritingSection };
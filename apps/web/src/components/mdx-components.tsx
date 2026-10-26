// @ts-nocheck
"use client";

import Link from "next/link";

import StepLarge from "@/components/step-large";
import StepLargeCustom from "@/components/step-large-custom";
import HighlightBox from "@/components/highlight-box";
import StepCheck from "@/components/step-check";
import Divider from "@/components/divider";
import VideoDemo from "./video-demo";
import VideoComponent from "./video-component";
import Button from "./button";

const TweetEmbed = () => null;

const MdxImage = ({ width, height, alt = "", ...props }) => (
    <img width={width} height={height} alt={alt} loading="lazy" {...props} />
);

const CustomLink = (props) => {
    const href = props.href;
    const isInternalLink =
        href && (href.startsWith("/") || href.startsWith("#"));

    if (isInternalLink) {
        return <Link href={href} {...props}></Link>;
    }

    return <a target="_blank" rel="noopener noreferrer" {...props} />;
};

const CodeBlock = ({ children, ...props }) => (
    <pre className="blog-code-block" {...props}>
        {children}
    </pre>
);

const Code = ({ children, ...props }) => (
    <code className="blog-code" {...props}>
        {children}
    </code>
);

const MDXComponents = {
    Image: MdxImage,
    a: CustomLink,
    pre: CodeBlock,
    code: Code,
    StepLarge,
    StepCheck,
    Tweet: TweetEmbed,
    VideoDemo,
    HighlightBox,
    Divider,
    StepLargeCustom,
    VideoComponent,
    Button,
};

export default MDXComponents;

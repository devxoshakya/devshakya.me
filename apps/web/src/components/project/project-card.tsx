"use client";

import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import { useSound } from "@web-kits/audio/react";

import { hover, tap } from "@/audio/core";
import { Icons } from "@/components/icons";
import BlurFade from "./blur-fade";
import VideoComponent from "./video-component";

interface ProjectCardProps {
    imageSrc: string;
    videoSrc?: string;
    title: string;
    tags: string[];
    timeline: string;
    tagline: string;
    delay: number;
    sourceCodeHref: string;
    liveDemoHref: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
    imageSrc,
    videoSrc,
    title,
    tags,
    timeline,
    delay,
    tagline,
    sourceCodeHref,
    liveDemoHref,
}) => {
    const playHover = useSound(hover);
    const playTap = useSound(tap);

    const handlePointerEnter = () => {
        playHover();
    };

    const handlePointerDown = (
        event: React.PointerEvent<HTMLAnchorElement>,
    ) => {
        if (event.button === 0) {
            playTap();
        }
    };

    return (
        <BlurFade delay={delay}>
            <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
                <Link
                    className="w-full max-w-full sm:col-start-1 sm:w-[115%]"
                    href={liveDemoHref as Route}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${title} project link`}
                    onPointerEnter={handlePointerEnter}
                    onPointerDown={handlePointerDown}
                >
                    <div className="group/card relative flex cursor-pointer flex-col gap-1 rounded-lg border border-gray-400/50 bg-[#e8e4e7]/70 shadow-2xl backdrop-blur-sm dark:border-white/10 dark:bg-[#121212] dark:shadow-[#121212]/50">
                        <div className="flex items-center justify-start">
                            <div className="flex gap-1 px-1 py-[1px] mt-[2px] ml-[2px]">
                                <div className="size-2 rounded-full bg-zinc-300 transition-all duration-300 group-hover/card:bg-red-500/90 dark:bg-white/10 dark:group-hover/card:bg-red-500/90"></div>
                                <div className="size-2 rounded-full bg-zinc-300 transition-all duration-300 group-hover/card:bg-yellow-500/90 dark:bg-white/10 dark:group-hover/card:bg-yellow-500/90"></div>
                                <div className="size-2 rounded-full bg-zinc-300 transition-all duration-300 group-hover/card:bg-green-500/90 dark:bg-white/10 dark:group-hover/card:bg-green-500/90"></div>
                            </div>
                            <div className="flex flex-1 justify-center">
                                <div className="w-36 -translate-x-3 overflow-hidden truncate rounded bg-[#cfccce] text-center text-[8px] text-[#707070] backdrop-blur-3xl dark:bg-[#1b1b1b]">
                                    {title}
                                </div>
                            </div>
                        </div>

                        <div className="flex h-full justify-center overflow-hidden rounded-lg">
                            {videoSrc ? (
                                <Suspense
                                    fallback={
                                        <Image
                                            width={1536}
                                            height={1000}
                                            alt={`${title} project image`}
                                            className="size-full rounded-lg object-cover transition-all duration-300 hover:scale-105"
                                            aria-label={`${title} project image`}
                                            src={imageSrc}
                                        />
                                    }
                                >
                                    <VideoComponent
                                        fileName={videoSrc}
                                        title={title}
                                    />
                                </Suspense>
                            ) : (
                                <Image
                                    width={1536}
                                    height={1000}
                                    alt={`${title} project image`}
                                    className="size-full rounded-lg object-cover transition-all duration-300 hover:scale-105"
                                    aria-label={`${title} project image`}
                                    src={imageSrc}
                                />
                            )}
                        </div>
                    </div>
                </Link>
                <div className="ml-0 min-w-0 space-y-2 sm:col-start-2 sm:ml-1">
                    <h2 className="mb-1 text-base font-semibold dark:text-white">
                        {title}
                    </h2>
                    <p className="mb-1 text-[11px] text-gray-800 dark:text-gray-50">
                        {timeline}
                    </p>
                    <p className="mb-2 text-[11px] leading-relaxed dark:text-slate-300">
                        {tagline}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag, index) => (
                            <div
                                className="rounded-sm bg-[#EBEBEB]/60 px-1 py-0.5 text-[9px] font-medium text-black before:mr-1 before:h-[90%] before:w-0.5 before:-translate-x-0.5 before:rounded-xl before:bg-zinc-800/90 before:text-transparent before:content-['f'] dark:bg-zinc-900/90 dark:text-white dark:before:bg-white"
                                key={index}
                            >
                                {tag}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={sourceCodeHref as Route}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${title} source code link`}
                                onPointerEnter={handlePointerEnter}
                                onPointerDown={handlePointerDown}
                                className="flex items-center justify-around gap-1 rounded-sm bg-black/85 px-1.5 py-1 text-[10px] font-semibold text-white dark:bg-white dark:text-black"
                            >
                                <Icons.github className="inline-block size-3 invert dark:invert-0" />
                                Source Code
                            </Link>
                            <Link
                                href={liveDemoHref as Route}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${title} live demo link`}
                                onPointerEnter={handlePointerEnter}
                                onPointerDown={handlePointerDown}
                                className="group/demo flex items-center justify-around gap-1 rounded-sm bg-black/85 px-1.5 py-1 text-[10px] font-semibold text-white dark:bg-white dark:text-black"
                            >
                                Live Demo
                                <ArrowRight className="size-3 rounded-full border border-transparent stroke-1 transition-all duration-300 ease-linear group-hover/demo:-rotate-45 group-hover/demo:border-slate-50 group-hover/demo:stroke-[2px] dark:group-hover/demo:border-slate-950" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </BlurFade>
    );
};

export default ProjectCard;

"use client";

import type { ComponentType, ReactNode } from "react";
import {
    BriefcaseBusinessIcon,
    ChevronDownIcon,
    CodeXmlIcon,
    LightbulbIcon,
} from "lucide-react";

import { Button } from "@devshakya.me/ui/components/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@devshakya.me/ui/components/collapsible";

import { cn } from "@/lib/utils";

import { Panel, PanelHeader, PanelTitle } from "@/components/experience/panel";

import { PanelTitleCopy } from "@/components/experience/panel-copy";
import { Title } from "@devshakya.me/ui/components/title";
import { CopyLink } from "../copy-link";

/* =========================================================
   Types
========================================================= */

export type ExperienceRole = {
    id: string;
    title: string;
    type?: string;
    start: string;
    end?: string;
    icon?: ComponentType<{ className?: string }>;
    description?: string;
    highlights?: string[];
    bullets?: string[];
    skills?: string[];
};

export type Experience = {
    id: string;
    company: string;
    logo?: string;
    website?: string;
    location?: string;
    roles: ExperienceRole[];
};

/* =========================================================
   Experience Data
========================================================= */

export const EXPERIENCES: Experience[] = [
    {
        id: "boredheadlabs",
        company: "Boredheadlabs",
        logo: "https://www.devxoshakya.xyz/images/boredheadlabs.jpeg",
        website: "https://boredheadlabs.com",
        location: "Remote",
        roles: [
            {
                id: "boredheadlabs-swe",
                title: "Software Engineer",
                type: "Full-time",
                start: "Jan 2026",
                end: "Present",
                icon: CodeXmlIcon,
                description:
                    "Working on production applications, backend systems, and infrastructure with a focus on scalable and reliable software.",
                highlights: ["Production systems", "Backend architecture"],
                bullets: [
                    "Designed and implemented backend APIs and services for production applications.",
                    "Worked across frontend, backend, databases, and cloud infrastructure.",
                    "Improved application performance and reliability across multiple services.",
                ],
                skills: [
                    "TypeScript",
                    "Next.js",
                    "Hono",
                    "PostgreSQL",
                    "Prisma",
                    "Cloudflare",
                ],
            },
            {
                id: "boredheadlabs-fsd",
                title: "Full Stack Developer Intern",
                type: "Internship",
                start: "Aug 2025",
                end: "Dec 2025",
                icon: LightbulbIcon,
                description:
                    "Built and shipped full-stack features across modern web applications while working closely with backend and deployment systems.",
                highlights: [
                    "Full-stack development",
                    "Production deployments",
                ],
                bullets: [
                    "Built responsive interfaces and application features using Next.js and React.",
                    "Implemented APIs, database integrations, authentication, and third-party services.",
                    "Contributed to deployment workflows and production debugging.",
                ],
                skills: [
                    "TypeScript",
                    "Next.js",
                    "React",
                    "MongoDB",
                    "Node.js",
                    "Docker",
                ],
            },
        ],
    },

    {
        id: "mp-pharmaceuticals",
        company: "M.P. Pharmaceuticals",
        logo: "https://www.devxoshakya.xyz/images/mp-pharma.png",
        website: "https://mppharmaceuticals.com",
        location: "Ambala, India",
        roles: [
            {
                id: "mp-pharmaceuticals-fullstack",
                title: "Full Stack Developer Intern",
                type: "Internship",
                start: "Jul 2025",
                end: "Sep 2025",
                description:
                    "Built a modern production website and integrated AI-powered customer interaction into the platform.",
                highlights: ["Next.js 15", "AI chatbot integration"],
                bullets: [
                    "Developed the website using Next.js 15 with a component-driven architecture.",
                    "Integrated Cloudflare R2 for scalable asset storage and delivery.",
                    "Built a Gemini-powered chatbot for customer interactions.",
                ],
                skills: [
                    "Next.js 15",
                    "React",
                    "TypeScript",
                    "Tailwind CSS",
                    "Cloudflare R2",
                    "Gemini SDK",
                ],
            },
        ],
    },
];

/* =========================================================
   Main Experience Section
========================================================= */

const ID = "experience";
const MAX = 3;

export function Experiences() {
    return (
        <Panel id={ID} className="border-x-0">
            <span className="group/social flex items-center gap-1">
                <Title
                    className="text-xl ml-4 font-medium italic"
                    render={<h2>{"experience."}</h2>}
                />
                <CopyLink
                    title={"Experience"}
                    className="hidden group-hover/social:inline-flex"
                />
            </span>

            <div className="px-0">
                <ExperienceList experiences={EXPERIENCES.slice(0, MAX)} />
            </div>

            {EXPERIENCES.length > MAX && (
                <Collapsible className="group/collapsible">
                    <CollapsibleContent render={<div className="px-0" />}>
                        <ExperienceList experiences={EXPERIENCES.slice(MAX)} />
                    </CollapsibleContent>

                    <div className="-mt-px flex items-center justify-center py-4">
                        <CollapsibleTrigger
                            render={
                                <Button
                                    className="gap-2 pr-2.5 pl-3 shadow-[inset_0_0_1px] shadow-foreground/20"
                                    variant="secondary"
                                    size="sm"
                                >
                                    <span className="hidden group-data-closed/collapsible:block">
                                        Show more
                                    </span>

                                    <span className="hidden group-data-open/collapsible:block">
                                        Show less
                                    </span>

                                    <ChevronDownIcon className="group-data-open/collapsible:rotate-180" />
                                </Button>
                            }
                        />
                    </div>
                </Collapsible>
            )}
        </Panel>
    );
}

/* =========================================================
   Experience List
========================================================= */

function ExperienceList({ experiences }: { experiences: Experience[] }) {
    return (
        <>
            {experiences.map((experience, index) => (
                <ExperienceItem
                    key={experience.id}
                    experience={experience}
                    defaultOpen={index === 0}
                />
            ))}
        </>
    );
}

/* =========================================================
   Experience Item
========================================================= */

type Row = {
    key: string;
    kind: "node" | "branch";
    content: ReactNode;
};

/* ---------- Layout math (keep in sync) ----------
   trigger px-4 (16) + logo center (16) -> gutter line at x = 32px (left-8 in trigger)
   inside content: px-4 + row left-4      -> same x = 32px
   rows: py-1 (4px) + leading-6 (24px)    -> first line center y = 16px (h-4)
------------------------------------------------- */

export function ExperienceItem({
    experience,
    defaultOpen = false,
}: {
    experience: Experience;
    defaultOpen?: boolean;
}) {
    const { company, logo, roles } = experience;
    const rows = buildRows(experience);

    const latest = roles[0];
    const oldest = roles[roles.length - 1];

    const period =
        oldest && latest ? `${oldest.start} – ${latest.end ?? "Present"}` : "";

    const subtitle = roles.map((r) => r.title).join(" & ");

    return (
        <Collapsible className="group/exp border-b" defaultOpen={defaultOpen}>
            <CollapsibleTrigger className="relative flex w-full cursor-pointer items-start gap-2 px-4 py-4 text-left">
                {logo ? (
                    <img
                        src={logo}
                        alt=""
                        className="mt-1.5 size-8 shrink-0 rounded-full border bg-muted object-cover"
                    />
                ) : (
                    <span className="mt-1.5 grid size-8 shrink-0 place-items-center rounded-full border bg-muted text-muted-foreground">
                        <BriefcaseBusinessIcon className="size-4" />
                    </span>
                )}

                <span className="min-w-0 flex-1">
                    <span className="block text-base leading-6 font-medium">
                        {company}
                    </span>

                    <span className="block text-xs leading-5 text-muted-foreground">
                        {subtitle}
                    </span>
                </span>

                <span className="flex shrink-0 items-center gap-2 self-center">
                    <span className="font-mono text-xs text-muted-foreground">
                        {period}
                    </span>

                    <ChevronDownIcon
                        className="
    size-4
    text-muted-foreground
    transition-transform
    duration-400
    ease-out
    group-data-open/exp:rotate-180
  "
                    />
                </span>

                {/* Line from logo down into rows, only while open */}
                {rows.length > 0 && (
                    <span
                        aria-hidden
                        className="absolute top-[54px] bottom-0 left-8 hidden w-px bg-border group-data-open/exp:block"
                    />
                )}
            </CollapsibleTrigger>

            <CollapsibleContent
                className="
        h-(--collapsible-panel-height) overflow-hidden
        transition-[height,opacity,filter,transform] duration-300 ease-out
        data-starting-style:h-0 data-starting-style:-translate-y-1 data-starting-style:opacity-0 data-starting-style:blur-sm
        data-ending-style:h-0 data-ending-style:-translate-y-1 data-ending-style:opacity-0 data-ending-style:blur-sm
        motion-reduce:transition-none
    "
            >
                <div className="px-4 pb-4">
                    {rows.map((row, i) => {
                        const last = i === rows.length - 1;

                        return row.kind === "node" ? (
                            <NodeRow key={row.key} last={last}>
                                {row.content}
                            </NodeRow>
                        ) : (
                            <BranchRow key={row.key} last={last}>
                                {row.content}
                            </BranchRow>
                        );
                    })}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

/* =========================================================
   Timeline Rows
========================================================= */

function BranchRow({ last, children }: { last: boolean; children: ReactNode }) {
    return (
        <div className="relative py-1 pl-10">
            {last ? (
                // Only the final branch is curved
                <span
                    aria-hidden
                    className="absolute top-0 left-4 h-4 w-6 rounded-bl-lg border-b border-l border-border"
                />
            ) : (
                <>
                    <span
                        aria-hidden
                        className="absolute top-0 bottom-0 left-4 w-px bg-border"
                    />

                    <span
                        aria-hidden
                        className="absolute top-[15px] left-4 h-px w-6 bg-border"
                    />
                </>
            )}

            {children}
        </div>
    );
}

function NodeRow({ last, children }: { last: boolean; children: ReactNode }) {
    return (
        <div className="relative py-1 pl-10">
            <span
                aria-hidden
                className={cn(
                    "absolute top-0 left-4 w-px bg-border",
                    last ? "h-4" : "bottom-0",
                )}
            />

            {children}
        </div>
    );
}

/* =========================================================
   Build Timeline Rows
========================================================= */

function buildRows({ roles }: Experience): Row[] {
    const isMulti = roles.length > 1;

    return roles.flatMap((role) => {
        const rows: Row[] = [];

        /* Role heading */
        if (isMulti) {
            rows.push({
                key: `${role.id}-head`,
                kind: "node",
                content: <RoleHeading role={role} />,
            });
        }

        /* Description */
        if (role.description) {
            rows.push({
                key: `${role.id}-desc`,
                kind: "branch",
                content: (
                    <p className="text-sm leading-6">{role.description}</p>
                ),
            });
        }

        /* Highlights */
        if (role.highlights?.length) {
            rows.push({
                key: `${role.id}-highlights`,
                kind: "branch",
                content: (
                    <ChipRow
                        items={role.highlights}
                        className="text-foreground"
                    />
                ),
            });
        }

        /* Bullets */
        role.bullets?.forEach((bullet, i) => {
            rows.push({
                key: `${role.id}-b-${i}`,
                kind: "branch",
                content: (
                    <p className="text-sm leading-6 text-muted-foreground">
                        {bullet}
                    </p>
                ),
            });
        });

        /* Skills */
        if (role.skills?.length) {
            rows.push({
                key: `${role.id}-skills`,
                kind: "branch",
                content: (
                    <ChipRow
                        items={role.skills}
                        className="text-muted-foreground"
                    />
                ),
            });
        }

        return rows;
    });
}

/* =========================================================
   Role Heading
========================================================= */

function RoleHeading({ role }: { role: ExperienceRole }) {
    const Icon = role.icon ?? BriefcaseBusinessIcon;

    return (
        <>
            <span className="absolute top-1 left-1 grid size-6 place-items-center rounded-md border bg-muted text-muted-foreground">
                <Icon className="size-3.5" />
            </span>

            <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm leading-6 font-medium">
                    {role.title}

                    {role.type && (
                        <span className="font-normal text-muted-foreground">
                            {" "}
                            · {role.type}
                        </span>
                    )}
                </p>

                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {formatPeriod(role)}
                </span>
            </div>
        </>
    );
}

/* =========================================================
   Chips
========================================================= */

function ChipRow({
    items,
    className,
}: {
    items: string[];
    className?: string;
}) {
    return (
        <ul className="flex flex-wrap gap-1.5">
            {items.map((item) => (
                <li
                    key={item}
                    className={cn(
                        "inline-flex h-6 items-center rounded-md border bg-muted/50 px-2 font-mono text-xs shadow-[inset_0_0_1px] shadow-foreground/20",
                        className,
                    )}
                >
                    {item}
                </li>
            ))}
        </ul>
    );
}

/* =========================================================
   Date Formatting
========================================================= */

function formatPeriod({ start, end }: Pick<ExperienceRole, "start" | "end">) {
    return `${start} – ${end ?? "Present"}`;
}

"use client";

import type { Route } from "next";

import { AppLink } from "@/components/ui/app-link";
import { Badge } from "@devshakya.me/ui/components/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@devshakya.me/ui/components/tooltip";
import type { SoftwareItem } from "@/constants/software";
import { cn } from "@/lib/utils";

interface TechStackItemProps extends Omit<
    React.ComponentProps<"div">,
    "title"
> {
    index: number;
    category: string;
    items: SoftwareItem[];
    variant?: "list" | "grid";
}

const TechStackItem = ({
    index,
    category,
    items,
    variant = "list",
    className,
    ...attr
}: TechStackItemProps) => {
    const isGrid = variant === "grid";
    const categoryId = `stack-${category
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/gu, "-")
        .replaceAll(/(^-|-$)/gu, "")}`;

    return (
        <div
            className={cn(
                "transition-[border-color,opacity] duration-50 hover:opacity-100 group-hover:opacity-30 grid items-start gap-y-2 py-4 sm:grid-cols-[var(--col-left-width)_1fr]",
                className,
            )}
            {...attr}
        >
            <div
                id={categoryId}
                className="text-sm/(--badge-height) text-muted-foreground"
            >
                <span
                    className="mr-1.5 font-mono text-muted-foreground/50 select-none"
                    aria-hidden
                >
                    {(index + 1).toString().padStart(2, "0")}
                </span>
                {category}
            </div>

            <ul
                aria-labelledby={categoryId}
                className="flex flex-wrap gap-x-2 gap-y-2 sm:pl-4"
            >
                {items.map((item) => (
                    <li key={item.key} className="flex">
                        <AppLink href={item.href as Route} target="_blank">
                            {isGrid ? (
                                <div className="rounded-md border p-1">
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <div className="flex size-10 select-none items-center justify-center p-1 rounded-sm border [&_svg:not([class*='size-'])]:size-6">
                                                    {item.icon}
                                                </div>
                                            }
                                        />
                                        <TooltipContent>
                                            {item.title}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="
                            inline-flex h-7 w-fit
                            items-center
                            gap-1.5
                            rounded-md
                            border border-dashed
                            px-2
                            py-0
                            text-[13px]
                            font-semibold
                            leading-none
                            whitespace-nowrap

                            bg-black/5
                            text-black
                            border-black/30

                            dark:bg-white/5
                            dark:text-white
                            dark:border-white/35
                        "
                                >
                                    <span className="inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
                                        {item.icon}
                                    </span>

                                    <span>{item.title}</span>
                                </Badge>
                            )}
                        </AppLink>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export { TechStackItem, type TechStackItemProps };

"use client";

import type { ComponentPropsWithoutRef, ReactElement } from "react";
import { cn } from "@/lib/utils";
import { CopyLink } from "@/components/copy-link";

export function PanelTitleCopy({
    id,
    ...props
}: Omit<ComponentPropsWithoutRef<typeof CopyLink>, "title"> & {
    id: string;
}) {
    return (
          <CopyLink
                title={id}
            className={cn(
                "absolute top-1 ml-1 size-7 shrink-0 border-none text-muted-foreground opacity-0 transition-opacity group-hover/panel-title:opacity-100",
                
            )}
            {...props}
        />
    );
}

type HeadingTypes = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type HeadingProps<T extends HeadingTypes> = ComponentPropsWithoutRef<T> & {
    as?: T;
};

export function Heading<T extends HeadingTypes = "h1">({
    as,
    className,
    ...props
}: HeadingProps<T>): ReactElement {
    const Comp = as ?? "h1";

    if (!props.id) {
        return <Comp className={className} {...props} />;
    }

    return (
        <Comp
            className={cn(
                "group/heading flex flex-row items-center gap-1",
                className,
            )}
            {...props}
        >
            <a href={`#${props.id}`} className="peer not-prose">
                {props.children}
            </a>

            <CopyLink
                title={props.id}
                className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/heading:opacity-100"
            />
        </Comp>
    );
}

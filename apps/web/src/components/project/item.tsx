"use client";

import { GlobeIcon } from "lucide-react";
import type { Route } from "next";
import React from "react";

import { Icons } from "@/components/icons";
import { MediaPreview } from "@/components/media-preview";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@devshakya.me/ui/components/button";
import type { GlimpseData } from "@/components/ui/glimpse/types";
import { Title } from "@devshakya.me/ui/components/title";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@devshakya.me/ui/components/tooltip";
import { cn } from "cn";
import type { Project } from "@/types/projects";

interface ProjectLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isGrid: boolean;
  preview?: GlimpseData | null;
  listClassName?: string;
}

const ProjectLink = ({
  href,
  label,
  icon,
  isGrid,
  preview,
  listClassName,
  slug,
  title,
}: ProjectLinkProps & { slug: string; title: string }) => {
 

  if (isGrid) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              nativeButton={false}
              render={
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                />
              }
            />
          }
        >
          {icon}
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <AppLink
      className={cn(
        "text-muted-foreground min-w-[60px] text-xs font-normal",
        listClassName
      )}
      href={href as Route}
      target="_blank"
      external
      previewSide="bottom"
      preview={preview}
    >
      {label}
    </AppLink>
  );
};

interface ProjectItemProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    Pick<Project, "slug" | "title" | "description" | "links"> {
  showHeader?: boolean;
  variant?: string;
  previews?: Record<string, GlimpseData>;
}

const ProjectItem = ({
  slug,
  title,
  links,
  description,
  showHeader = true,
  className,
  variant = "list",
  previews,
  ...attr
}: ProjectItemProps) => {
  const isGrid = variant === "grid";
  const image = previews?.[links?.website ?? ""]?.image ?? "";
  const projectHref = links.website ?? links.github;

  const titleLink = (
    projectHref ? (
      <a
        href={projectHref}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline underline-offset-4"
      >
        {title}
      </a>
    ) : (
      title
    )
  );

  return (
    <div
      className={cn(
        "py-4 w-full space-y-1 transition-[border-color,opacity] duration-50 hover:opacity-100 group-hover:opacity-30",
        className
      )}
      {...attr}
    >
      {isGrid && image && (
        <MediaPreview
          src={image}
          title={title}
          className="mb-2 aspect-1200/630"
        />
      )}
      <div className="flex items-center justify-between gap-4">
        <Title
          className="font-sans text-base font-normal"
          render={showHeader ? <h3>{titleLink}</h3> : <h2>{titleLink}</h2>}
        />
        <div className="flex shrink-0 flex-row items-center justify-start gap-1.5">
          {links.website && (
            <ProjectLink
              href={links.website}
              label="Website"
              icon={<GlobeIcon />}
              isGrid={isGrid}
              preview={previews?.[links.website]}
              listClassName="min-w-[66px]"
              slug={slug}
              title={title}
            />
          )}
          {links.github && (
            <ProjectLink
              href={links.github}
              label="GitHub"
              icon={<Icons.github />}
              isGrid={isGrid}
              preview={previews?.[links.github]}
              slug={slug}
              title={title}
            />
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-sm font-normal">{description}</p>
    </div>
  );
};

export { ProjectItem, type ProjectItemProps };

"use client";

import { useState } from "react";

import { CopyLink } from "@/components/copy-link";
import { Title } from "@devshakya.me/ui/components/title";
import { ViewToggle } from "@/components/view-tabs";
import { cn } from "@/lib/utils";
import type { Craft } from "@/types/crafts";

import { CraftItem } from "./item";

interface CraftsViewProps {
  crafts: readonly Craft[];
  showHeader?: boolean;
  headerClassName?: string;
  viewClassName?: string;
}

const CraftsView = ({
  crafts,
  showHeader = true,
  headerClassName,
  viewClassName,
}: CraftsViewProps) => {

  return (
    <>
      {showHeader && (
        <div
          className={cn(
            "flex items-center justify-between gap-4",
            headerClassName
          )}
        >
          <div className="group/projects flex-1 flex items-center gap-1">
            <Title
              className="text-xl font-medium italic"
              render={<h2>{"crafts."}</h2>}
            />
            <CopyLink
              title={"Crafts"}
              className="hidden group-hover/projects:inline-flex"
            />
          </div>

        </div>
      )}

      <div
        className={cn(
          "group grid grid-cols-1",
          viewClassName
        )}
      >
        {crafts.map((craft) => (
          <CraftItem
            key={craft.slug}
            {...craft}
            showHeader={showHeader}
          />
        ))}
      </div>
    </>
  );
};

export { CraftsView };

"use client";

import { LayoutGridIcon, TextAlignJustifyIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@devshakya.me/ui/components/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@devshakya.me/ui/components/tooltip";

type ViewVariant = "list" | "grid";

interface ViewToggleProps {
    value: ViewVariant;
    onChange: (value: ViewVariant) => void;
    section: string;
}

const ViewToggle = ({ value, onChange, section }: ViewToggleProps) => (
    <Tabs
        value={value}
        onValueChange={(next) => {
            if (!next) {
                return;
            }

            onChange(next as ViewVariant);
        }}
    >
        <TabsList>
            <Tooltip disabled={value === "grid"}>
                <TooltipTrigger
                    render={
                        <TabsTrigger
                            value="grid"
                            aria-label="Grid"
                            className="px-1"
                        />
                    }
                >
                    <LayoutGridIcon />
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Grid</TooltipContent>
            </Tooltip>
            <Tooltip disabled={value === "list"}>
                <TooltipTrigger
                    render={
                        <TabsTrigger
                            value="list"
                            aria-label="List"
                            className="px-1"
                        />
                    }
                >
                    <TextAlignJustifyIcon />
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>List</TooltipContent>
            </Tooltip>
        </TabsList>
    </Tabs>
);

export { ViewToggle };

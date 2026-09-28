"use client";

import { LayoutGridIcon, TextAlignJustifyIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@devshakya.me/ui/components/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@devshakya.me/ui/components/tooltip";

const ViewToggle = ({ value, onChange, section }: any) => (
    <Tabs
        value={value}
        onValueChange={(next) => {
            if (!next) {
                return;
            }
        }}
    >
        <TabsList>
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
            <Tooltip disabled={value === "grid"}>
                <TooltipTrigger
                    render={
                        <TabsTrigger
                            value="grid"
                            aria-label="Showcase"
                            className="px-1"
                        />
                    }
                >
                    <LayoutGridIcon />
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Showcase</TooltipContent>
            </Tooltip>
        </TabsList>
    </Tabs>
);

export { ViewToggle };

"use client";
import Logo from "@/components/logo";
import { DottedSeparator } from "@/components/separator";
import { useEffect, useState } from "react";

const SiteFooter = () => {

    const [visitorCount, setVisitorCount] = useState<number | null>(null);
    useEffect(() => {
        async function fetchVisitorCount() {
            // Fetch visitor count logic here
            const response = await fetch("/api/visitors", {
                method: "POST",
                credentials: "include"
            });
            const data = await response.json();
            setVisitorCount(data.total_visitors);
        }
        fetchVisitorCount();
    }, []);

    return (
        <footer className="mt-auto animate-slide-in delay-700 view-container px-4">
            <div className="flex justify-center pb-4">
                <Logo
                    aria-label="Home"
                    role="img"
                    className="text-foreground h-12 mb-5 mt-5 w-auto"
                />
            </div>
            <DottedSeparator className="mb-3" />
            <div className="flex items-center justify-between  pb-[calc(env(safe-area-inset-bottom,0)+0.75rem)]">
                <p className="text-muted-foreground text-xs">
                    &copy; {new Date().getFullYear()} <span>Dev Shakya</span>
                </p>
                <p className="text-muted-foreground text-xs">
                    you're visitor # {visitorCount !== null ? visitorCount : "loading..."}
                </p>
            </div>
        </footer>
    );
};

export { SiteFooter };

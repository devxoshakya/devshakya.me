"use client";

import { Loader2, LogOut } from "lucide-react";

import { Button } from "@devshakya.me/ui/components/button";
import {
    Section,
    // Keep this import if your Section component is exported separately.
} from "@devshakya.me/ui/components/section";
import { Title } from "@devshakya.me/ui/components/title";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@devshakya.me/ui/components/tooltip";

import { CopyLink } from "@/components/copy-link";
import { useAdminSession } from "@/lib/admin-auth";

import { LoginForm } from "./login";
import { Uploader } from "./uploader";

export function AdminUpload() {
    const { status, markAuthed, markExpired, signOut } = useAdminSession();

    return (
        <TooltipProvider>
            <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6">
                <Section id="upload-pins">
                    <header className="flex items-center justify-between">
                        <span className="group/social flex items-center gap-1">
                            <Title
                                className="text-xl font-medium italic"
                                render={<h1>{"upload pins."}</h1>}
                            />
                            <CopyLink
                                title="upload-pins"
                                className="hidden group-hover/social:inline-flex"
                            />
                        </span>

                        {status === "authed" && (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Sign out"
                                            onClick={signOut}
                                        >
                                            <LogOut />
                                        </Button>
                                    }
                                />
                                <TooltipContent>Sign out</TooltipContent>
                            </Tooltip>
                        )}
                    </header>   

                    {status === "loading" && (
                        <Loader2 className="mx-auto mt-24 size-5 animate-spin text-muted-foreground" />
                    )}

                    {status === "anon" && <LoginForm onAuthed={markAuthed} />}

                    {status === "authed" && (
                        <Uploader onSessionExpired={markExpired} />
                    )}
                </Section>
            </main>
        </TooltipProvider>
    );
}

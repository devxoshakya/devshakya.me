"use client";

import { useState, type FormEvent } from "react";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { Fingerprint, Loader2 } from "lucide-react";

import { Button } from "@devshakya.me/ui/components/button";
import { Input } from "@devshakya.me/ui/components/input";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@devshakya.me/ui/components/tooltip";

import {
    ApiError,
    loginWithPasskey,
    loginWithPassword,
} from "@/lib/admin-auth";

type Method = "password" | "passkey";

function formatWait(seconds: number): string {
    return seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds}s`;
}

function describe(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.status === 429) {
            return err.retryAfter
                ? `Too many attempts. Try again in ${formatWait(err.retryAfter)}.`
                : "Too many attempts. Try again later.";
        }
        if (err.status >= 500) {
            return "Service unavailable. Try again shortly.";
        }
        return err.message;
    }
    if (err instanceof Error && err.name === "NotAllowedError") {
        return "Passkey sign-in was cancelled.";
    }
    return "Something went wrong. Try again.";
}

export function LoginForm({ onAuthed }: { onAuthed: () => void }) {
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState<Method | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Rendered only after the session check on the client, so window is available.
    const passkeySupported = browserSupportsWebAuthn();

    async function run(method: Method, action: () => Promise<void>) {
        setBusy(method);
        setError(null);
        try {
            await action();
            onAuthed();
        } catch (err) {
            setError(describe(err));
        } finally {
            setBusy(null);
        }
    }

    function onSubmit(event: FormEvent) {
        event.preventDefault();
        if (password) {
            run("password", () => loginWithPassword(password));
        }
    }

    const passkeyButton = (
        <Button
            className="w-full"
            disabled={!passkeySupported || busy !== null}
            onClick={() => run("passkey", loginWithPasskey)}
        >
            {busy === "passkey" ? (
                <Loader2 className="animate-spin" />
            ) : (
                <Fingerprint />
            )}
            Sign in with passkey
        </Button>
    );

    return (
        <div className="mx-auto flex w-full max-w-sm flex-col gap-4 pt-20">
            {passkeySupported ? (
                passkeyButton
            ) : (
                <Tooltip>
                    <TooltipTrigger
                        render={<span tabIndex={0} className="w-full" />}
                    >
                        {passkeyButton}
                    </TooltipTrigger>
                    <TooltipContent>
                        Passkeys are not supported in this browser
                    </TooltipContent>
                </Tooltip>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    aria-label="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={busy !== null}
                />
                <Button
                    type="submit"
                    variant="outline"
                    disabled={!password || busy !== null}
                >
                    {busy === "password" && (
                        <Loader2 className="animate-spin" />
                    )}
                    Sign in
                </Button>
            </form>

            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}

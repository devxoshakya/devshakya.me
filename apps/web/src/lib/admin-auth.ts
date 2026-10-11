import { useCallback, useEffect, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";

// Adjust these if your aliased auth routes differ.
const ROUTES = {
    password: "/api/auth/login/password",
    passkeyOptions: "/api/auth/passkey/login/options",
    passkeyVerify: "/api/auth/passkey/login/verify",
    refresh: "/api/auth/refresh",
    logout: "/api/auth/logout",
} as const;

// Custom header forces a CORS preflight (CSRF layer from the API design).
const BASE_HEADERS = { "X-Requested-With": "fetch" };
const JSON_HEADERS = { ...BASE_HEADERS, "Content-Type": "application/json" };

export class ApiError extends Error {
    status: number;
    retryAfter?: number;

    constructor(message: string, status: number, retryAfter?: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.retryAfter = retryAfter;
    }
}

async function toApiError(res: Response): Promise<ApiError> {
    let message = `Request failed (${res.status})`;
    try {
        const body = await res.json();
        if (typeof body?.error?.message === "string") {
            message = body.error.message;
        } else if (typeof body?.detail === "string") {
            message = body.detail;
        }
    } catch {
        // Body was not JSON, keep the default message.
    }
    const retry = Number(res.headers.get("Retry-After"));
    return new ApiError(message, res.status, retry > 0 ? retry : undefined);
}

// Access token lives in memory only. A reload restores it through the refresh cookie.
let accessToken: string | null = null;

export const hasSession = () => accessToken !== null;

function readToken(data: unknown): string {
    const token = (data as { access_token?: unknown } | null)?.access_token;
    if (typeof token !== "string" || !token) {
        throw new ApiError("Unexpected sign-in response", 502);
    }
    return token;
}

export async function loginWithPassword(password: string): Promise<void> {
    const res = await fetch(ROUTES.password, {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ password }),
    });
    if (!res.ok) {
        throw await toApiError(res);
    }
    accessToken = readToken(await res.json());
}

export async function loginWithPasskey(): Promise<void> {
    const optionsRes = await fetch(ROUTES.passkeyOptions, {
        method: "POST",
        credentials: "include",
        headers: BASE_HEADERS,
    });
    if (!optionsRes.ok) {
        throw await toApiError(optionsRes);
    }
    const body = await optionsRes.json();
    const optionsJSON = body.options ?? body;

    const credential = await startAuthentication({ optionsJSON });

    const res = await fetch(ROUTES.passkeyVerify, {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify(credential),
    });
    if (!res.ok) {
        throw await toApiError(res);
    }
    accessToken = readToken(await res.json());
}

// Shared in-flight promise: StrictMode double effects or parallel 401s must not
// rotate the refresh token twice (the second call would look like token reuse).
let refreshing: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
    refreshing ??= (async () => {
        try {
            const res = await fetch(ROUTES.refresh, {
                method: "POST",
                credentials: "include",
                headers: BASE_HEADERS,
            });
            if (!res.ok) {
                accessToken = null;
                return false;
            }
            accessToken = readToken(await res.json());
            return true;
        } catch {
            accessToken = null;
            return false;
        } finally {
            refreshing = null;
        }
    })();
    return refreshing;
}

export async function logout(): Promise<void> {
    try {
        await fetch(ROUTES.logout, {
            method: "POST",
            credentials: "include",
            headers: {
                ...BASE_HEADERS,
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        });
    } catch {
        // Local sign-out still happens below.
    } finally {
        accessToken = null;
    }
}

/** Authenticated fetch. On 401 it refreshes the session once and retries. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const send = () =>
        fetch(path, {
            ...init,
            credentials: "include",
            headers: {
                ...BASE_HEADERS,
                ...(init.body ? { "Content-Type": "application/json" } : {}),
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        });

    let res = await send();
    if (res.status === 401 && (await refreshSession())) {
        res = await send();
    }
    return res;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await apiFetch(path, init);
    if (!res.ok) {
        throw await toApiError(res);
    }
    return (await res.json()) as T;
}

export type SessionStatus = "loading" | "authed" | "anon";

export function useAdminSession() {
    const [status, setStatus] = useState<SessionStatus>("loading");

    useEffect(() => {
        let alive = true;
        if (hasSession()) {
            setStatus("authed");
            return;
        }
        refreshSession().then((ok) => {
            if (alive) {
                setStatus(ok ? "authed" : "anon");
            }
        });
        return () => {
            alive = false;
        };
    }, []);

    const markAuthed = useCallback(() => setStatus("authed"), []);
    const markExpired = useCallback(() => setStatus("anon"), []);
    const signOut = useCallback(async () => {
        await logout();
        setStatus("anon");
    }, []);

    return { status, markAuthed, markExpired, signOut };
}
import { ApiError, apiJson } from "@/lib/admin-auth";
import type { ImageMeta } from "@/lib/blurhash";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_BYTES = 15 * 1024 * 1024;

export interface PinDetails {
    altText: string;
    caption: string;
    link: string;
}

interface UploadTicket {
    pin_id: string;
    upload_url: string;
    headers: Record<string, string>;
    expires_at: string;
}

export interface Pin {
    id: string;
    caption: string | null;
    alt_text: string;
    link_url: string | null;
    image_url: string;
    cdn_url: string;
    mime_type: string;
    blur_hash: string | null;
    size_bytes: number;
    width: number | null;
    height: number | null;
    created_at: string;
    updated_at: string;
}

// The browser sets these itself and refuses them in setRequestHeader.
const FORBIDDEN_HEADERS = new Set(["content-length", "host"]);

function cleanLink(link: string): string | null {
    const value = link.trim();
    if (!value) {
        return null;
    }
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new Error("Link must be a full URL starting with http:// or https://");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Link must start with http:// or https://");
    }
    return value;
}

// The upload limiter is small (capacity 10, slow refill), so wait and retry on 429.
async function withRateLimitRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for (let attempt = 1; ; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (!(err instanceof ApiError) || err.status !== 429 || attempt >= attempts) {
                throw err;
            }
            const seconds = Math.min(err.retryAfter ?? 30, 60);
            await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
        }
    }
}

function putFile(
    url: string,
    headers: Record<string, string>,
    file: File,
    onProgress: (percent: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);

        let hasContentType = false;
        for (const [name, value] of Object.entries(headers)) {
            const lower = name.toLowerCase();
            if (FORBIDDEN_HEADERS.has(lower)) {
                continue;
            }
            if (lower === "content-type") {
                hasContentType = true;
            }
            xhr.setRequestHeader(name, value);
        }
        if (!hasContentType) {
            xhr.setRequestHeader("Content-Type", file.type);
        }

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };
        xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
                ? resolve()
                : reject(new Error(`Upload to storage failed (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Network error while uploading"));
        xhr.send(file);
    });
}

/** Ticket -> direct PUT to storage -> confirm. Returns the created pin. */
export async function uploadPin(
    file: File,
    meta: ImageMeta,
    details: PinDetails,
    onProgress: (percent: number) => void
): Promise<Pin> {
    const link = cleanLink(details.link);

    const ticket = await withRateLimitRetry(() =>
        apiJson<UploadTicket>("/api/pins/upload-url", {
            method: "POST",
            body: JSON.stringify({
                mime_type: file.type,
                size_bytes: file.size,
                width: meta.width,
                height: meta.height,
                blur_hash: meta.blurHash,
            }),
        })
    );

    await putFile(ticket.upload_url, ticket.headers, file, onProgress);

    return apiJson<Pin>(`/api/pins/${ticket.pin_id}/confirm`, {
        method: "POST",
        body: JSON.stringify({
            alt_text: details.altText.trim(),
            caption: details.caption.trim() || null,
            link_url: link,
            blur_hash: meta.blurHash,
        }),
    });
}
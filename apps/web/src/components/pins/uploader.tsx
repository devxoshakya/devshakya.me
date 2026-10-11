"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type DragEvent,
} from "react";
import {
    AlertCircle,
    Check,
    ImageIcon,
    Loader2,
    Plus,
    Upload,
    X,
} from "lucide-react";

import { Button } from "@devshakya.me/ui/components/button";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@devshakya.me/ui/components/empty";
import { Input } from "@devshakya.me/ui/components/input";
import { Progress } from "@devshakya.me/ui/components/progress";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@devshakya.me/ui/components/tooltip";

import { ApiError } from "@/lib/admin-auth";
import { readImage, type ImageMeta } from "@/lib/blurhash";
import { ACCEPTED_TYPES, MAX_BYTES, uploadPin } from "@/lib/pins-upload";

const CONCURRENCY = 2;
const ACCEPT = ACCEPTED_TYPES.join(",");
const MAX_MB = MAX_BYTES / 1024 / 1024;

type Status = "preparing" | "ready" | "uploading" | "done" | "error";

interface Item {
    id: string;
    file: File;
    previewUrl: string;
    meta?: ImageMeta;
    alt: string;
    caption: string;
    link: string;
    status: Status;
    progress: number;
    error?: string;
}

const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function Uploader({
    onSessionExpired,
}: {
    onSessionExpired: () => void;
}) {
    const [items, setItems] = useState<Item[]>([]);
    const [rejected, setRejected] = useState<string[]>([]);
    const [dragging, setDragging] = useState(false);
    const [running, setRunning] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const urls = useRef(new Set<string>());

    useEffect(() => {
        const created = urls.current;
        return () => {
            created.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    const patch = useCallback(
        (id: string, changes: Partial<Item>) =>
            setItems((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, ...changes } : item,
                ),
            ),
        [],
    );

    const addFiles = useCallback(
        (list: FileList | File[]) => {
            const accepted: Item[] = [];
            const problems: string[] = [];

            for (const file of Array.from(list)) {
                if (
                    !(ACCEPTED_TYPES as readonly string[]).includes(file.type)
                ) {
                    problems.push(`${file.name}: unsupported type`);
                    continue;
                }
                if (file.size > MAX_BYTES) {
                    problems.push(`${file.name}: larger than ${MAX_MB} MB`);
                    continue;
                }
                const previewUrl = URL.createObjectURL(file);
                urls.current.add(previewUrl);
                accepted.push({
                    id: crypto.randomUUID(),
                    file,
                    previewUrl,
                    alt: "",
                    caption: "",
                    link: "",
                    status: "preparing",
                    progress: 0,
                });
            }

            setRejected(problems);
            if (accepted.length === 0) {
                return;
            }
            setItems((prev) => [...prev, ...accepted]);

            for (const item of accepted) {
                readImage(item.file)
                    .then((meta) => patch(item.id, { meta, status: "ready" }))
                    .catch((err) =>
                        patch(item.id, {
                            status: "error",
                            error:
                                err instanceof Error
                                    ? err.message
                                    : "Could not read image",
                        }),
                    );
            }
        },
        [patch],
    );

    function remove(id: string) {
        setItems((prev) => {
            const target = prev.find((item) => item.id === id);
            if (target) {
                URL.revokeObjectURL(target.previewUrl);
                urls.current.delete(target.previewUrl);
            }
            return prev.filter((item) => item.id !== id);
        });
    }

    function clearDone() {
        items
            .filter((item) => item.status === "done")
            .forEach((item) => remove(item.id));
    }

    const pending = items.filter(
        (item) =>
            item.meta && (item.status === "ready" || item.status === "error"),
    );
    const doneCount = items.filter((item) => item.status === "done").length;
    const missingAlt = pending.some((item) => !item.alt.trim());
    const canUpload = pending.length > 0 && !missingAlt && !running;
    const disabledReason = running
        ? null
        : pending.length === 0
          ? "Nothing left to upload"
          : missingAlt
            ? "Add alt text to every image"
            : null;

    async function uploadAll() {
        const queue = [...pending];
        if (queue.length === 0) {
            return;
        }
        setRunning(true);
        let expired = false;

        const run = async (item: Item) => {
            const meta = item.meta;
            if (!meta || expired) {
                return;
            }
            patch(item.id, {
                status: "uploading",
                progress: 0,
                error: undefined,
            });
            try {
                await uploadPin(
                    item.file,
                    meta,
                    {
                        altText: item.alt,
                        caption: item.caption,
                        link: item.link,
                    },
                    (progress) => patch(item.id, { progress }),
                );
                patch(item.id, { status: "done", progress: 100 });
            } catch (err) {
                if (err instanceof ApiError && err.status === 401) {
                    expired = true;
                }
                patch(item.id, {
                    status: "error",
                    error: err instanceof Error ? err.message : "Upload failed",
                });
            }
        };

        let next = 0;
        const worker = async () => {
            while (next < queue.length) {
                await run(queue[next++]);
            }
        };
        await Promise.all(
            Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
        );

        setRunning(false);
        if (expired) {
            onSessionExpired();
        }
    }

    function onDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files.length > 0) {
            addFiles(event.dataTransfer.files);
        }
    }

    const uploadButton = (
        <Button onClick={uploadAll} disabled={!canUpload}>
            {running ? <Loader2 className="animate-spin" /> : <Upload />}
            {running
                ? "Uploading"
                : pending.length > 0
                  ? `Upload ${pending.length}`
                  : "Upload"}
        </Button>
    );

    return (
        <div
            onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
            }}
            onDragLeave={(event) => {
                if (
                    !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                    )
                ) {
                    setDragging(false);
                }
            }}
            onDrop={onDrop}
            className={`rounded-lg mt-16 transition-shadow ${dragging ? "ring-2 ring-primary/40" : ""}`}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                hidden
                accept={ACCEPT}
                onChange={(event) => {
                    if (event.target.files) {
                        addFiles(event.target.files);
                    }
                    event.target.value = "";
                }}
            />

            {items.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <ImageIcon />
                        </EmptyMedia>
                        <EmptyTitle>No images yet</EmptyTitle>
                        <EmptyDescription>
                            Drop images here or browse. JPEG, PNG, WebP or AVIF,
                            up to {MAX_MB} MB each.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button
                            variant="outline"
                            onClick={() => inputRef.current?.click()}
                        >
                            Choose images
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground">
                            {items.length}{" "}
                            {items.length === 1 ? "image" : "images"}
                        </p>
                        <div className="flex items-center gap-2">
                            {doneCount > 0 && !running && (
                                <Button variant="ghost" onClick={clearDone}>
                                    Clear done
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => inputRef.current?.click()}
                            >
                                <Plus />
                                Add
                            </Button>
                            {disabledReason ? (
                                <Tooltip>
                                    <TooltipTrigger
                                        render={<span tabIndex={0} />}
                                    >
                                        {uploadButton}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {disabledReason}
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                uploadButton
                            )}
                        </div>
                    </div>

                    <ul className="flex flex-col gap-3">
                        {items.map((item) => (
                            <ItemRow
                                key={item.id}
                                item={item}
                                onChange={(changes) => patch(item.id, changes)}
                                onRemove={() => remove(item.id)}
                            />
                        ))}
                    </ul>
                </div>
            )}

            {rejected.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 text-sm text-destructive">
                    {rejected.map((message) => (
                        <li key={message}>{message}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ItemRow({
    item,
    onChange,
    onRemove,
}: {
    item: Item;
    onChange: (changes: Partial<Item>) => void;
    onRemove: () => void;
}) {
    const uploading = item.status === "uploading";
    const locked = uploading || item.status === "done";

    return (
        <li className="flex gap-3 rounded-lg border p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={item.previewUrl}
                alt=""
                className="size-16 shrink-0 rounded-md bg-muted object-cover"
            />

            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                        {item.file.name}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                        {formatSize(item.file.size)}
                        {item.meta
                            ? ` · ${item.meta.width}×${item.meta.height}`
                            : ""}
                    </span>
                </div>

                <Input
                    aria-label="Alt text"
                    placeholder="Alt text (required)"
                    maxLength={500}
                    value={item.alt}
                    disabled={locked}
                    onChange={(event) => onChange({ alt: event.target.value })}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                        aria-label="Caption"
                        placeholder="Caption"
                        maxLength={1000}
                        value={item.caption}
                        disabled={locked}
                        onChange={(event) =>
                            onChange({ caption: event.target.value })
                        }
                    />
                    <Input
                        aria-label="Link"
                        placeholder="Link (optional)"
                        inputMode="url"
                        maxLength={2048}
                        value={item.link}
                        disabled={locked}
                        onChange={(event) =>
                            onChange({ link: event.target.value })
                        }
                    />
                </div>

                {item.status === "preparing" && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="size-3 animate-spin" />
                        Generating blur hash
                    </p>
                )}
                {uploading && (
                    <Progress value={item.progress} className="h-1" />
                )}
                {item.status === "done" && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Check className="size-3" />
                        Uploaded
                    </p>
                )}
                {item.status === "error" && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="size-3 shrink-0" />
                        {item.error}
                    </p>
                )}
            </div>

            <Tooltip>
                <TooltipTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remove"
                            disabled={uploading}
                            onClick={onRemove}
                        />
                    }
                >
                    <X />
                </TooltipTrigger>
                <TooltipContent>Remove</TooltipContent>
            </Tooltip>
        </li>
    );
}

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { decode } from "blurhash";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";

type PinResponseItem = {
    id: string;
    caption: string | null;
    alt_text: string | null;
    link_url: string | null;
    image_url: string;
    cdn_url: string | null;
    blur_hash: string | null;
    width: number;
    height: number;
    size_bytes?: number;
    mime_type?: string;
    created_at?: string;
    updated_at?: string;
};

type PinsResponse = {
    items: PinResponseItem[];
    next_cursor: string | null;
};

type GalleryImage = {
    id: string;
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
    blurHash: string | null;
    linkUrl: string | null;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const BLURHASH_WIDTH = 32;
const BLURHASH_HEIGHT = 32;

const toGalleryImage = (pin: PinResponseItem): GalleryImage => ({
    id: pin.id,
    // Prefer the CDN URL; fall back to the R2 public URL.
    src: pin.cdn_url || pin.image_url,
    alt: pin.alt_text?.trim() || pin.caption?.trim() || "Pin image",
    caption: pin.caption?.trim() || "",
    width: pin.width > 0 ? pin.width : 1200,
    height: pin.height > 0 ? pin.height : 1200,
    blurHash: pin.blur_hash || null,
    linkUrl: pin.link_url,
});

function useBlurhashDataURL(hash: string | null) {
    const [decoded, setDecoded] = useState<{
        hash: string;
        url: string;
    } | null>(null);

    useEffect(() => {
        if (!hash) {
            setDecoded(null);
            return;
        }

        let cancelled = false;

        try {
            const pixels = decode(hash, BLURHASH_WIDTH, BLURHASH_HEIGHT);
            const canvas = document.createElement("canvas");
            canvas.width = BLURHASH_WIDTH;
            canvas.height = BLURHASH_HEIGHT;

            const context = canvas.getContext("2d");
            if (!context) {
                setDecoded(null);
                return () => {
                    cancelled = true;
                };
            }

            const imageData = context.createImageData(
                BLURHASH_WIDTH,
                BLURHASH_HEIGHT,
            );
            imageData.data.set(pixels);
            context.putImageData(imageData, 0, 0);

            if (!cancelled) {
                setDecoded({ hash, url: canvas.toDataURL("image/png") });
            }
        } catch {
            // Keep the regular muted background if a hash is missing or invalid.
            if (!cancelled) setDecoded(null);
        }

        return () => {
            cancelled = true;
        };
    }, [hash]);

    // Avoid showing the previous image's placeholder for a frame after selection changes.
    return decoded?.hash === hash ? decoded.url : null;
}

type GalleryPinProps = {
    image: GalleryImage;
    index: number;
    shouldReduceMotion: boolean | null;
    onOpen: (index: number) => void;
};

function GalleryPin({
    image,
    index,
    shouldReduceMotion,
    onOpen,
}: GalleryPinProps) {
    const blurHashURL = useBlurhashDataURL(image.blurHash);
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
    const loaded = loadedSrc === image.src;

    return (
        <motion.button
            type="button"
            aria-label={`Open pin: ${image.caption || image.alt}`}
            onClick={() => onOpen(index)}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{ duration: 0.65, ease: EASE }}
            whileHover={shouldReduceMotion ? undefined : { y: -2 }}
            className="group relative block w-full overflow-hidden rounded-2xl bg-muted text-left"
            style={{
                aspectRatio: `${image.width} / ${image.height}`,
                backgroundImage: blurHashURL
                    ? `url("${blurHashURL}")`
                    : undefined,
                backgroundPosition: "center",
                backgroundSize: "cover",
            }}
        >
            <motion.img
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                decoding="async"
                draggable={false}
                onLoad={() => setLoadedSrc(image.src)}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.035 }}
                transition={{ duration: 0.7, ease: EASE }}
                className={`absolute inset-0 block h-full w-full object-cover transition-opacity duration-500 ${
                    loaded ? "opacity-100" : "opacity-0"
                }`}
            />

            <div className="pointer-events-none absolute inset-0 flex items-end bg-black/0 p-4 opacity-0 transition-all duration-500 group-hover:bg-black/45 group-hover:opacity-100 sm:p-5">
                <span
                    className="block w-full min-w-0 truncate text-[10px] font-medium uppercase tracking-[0.08em] text-white sm:text-xs"
                    title={image.caption}
                >
                    {image.caption}
                </span>
            </div>
        </motion.button>
    );
}

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Pins() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const isFetchingRef = useRef(false);
    const nextCursorRef = useRef<string | null>(null);
    const hasMoreRef = useRef(true);

    const shouldReduceMotion = useReducedMotion();
    const isMobile = useMediaQuery("(max-width: 767px)");

    // True only on the client, so the lightbox portal never accesses document during SSR.
    const mounted = useSyncExternalStore(
        subscribeToNothing,
        getClientSnapshot,
        getServerSnapshot,
    );

    const selectedImage =
        selectedIndex !== null ? (images[selectedIndex] ?? null) : null;
    const selectedBlurhashURL = useBlurhashDataURL(
        selectedImage?.blurHash ?? null,
    );

    const columnCount = isMobile ? 2 : 3;
    const imageColumns = useMemo(() => {
        const columns: { image: GalleryImage; index: number }[][] = Array.from(
            { length: columnCount },
            () => [],
        );

        images.forEach((image, index) => {
            columns[index % columnCount].push({ image, index });
        });

        return columns;
    }, [images, columnCount]);

    const loadNextPage = useCallback(async () => {
        if (isFetchingRef.current || !hasMoreRef.current) return;

        isFetchingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ limit: "20" });
            if (nextCursorRef.current) {
                params.set("cursor", nextCursorRef.current);
            }

            const response = await fetch(`/api/pins?${params.toString()}`, {
                method: "GET",
                headers: { accept: "application/json" },
            });

            if (!response.ok) {
                throw new Error(`Unable to load pins (${response.status}).`);
            }

            const payload = (await response.json()) as PinsResponse;
            if (!Array.isArray(payload.items)) {
                throw new Error(
                    "The pins API returned an unexpected response.",
                );
            }

            const pageImages = payload.items.map(toGalleryImage);
            setImages((current) => {
                const existingIds = new Set(current.map((image) => image.id));
                const uniquePageImages = pageImages.filter(
                    (image) => !existingIds.has(image.id),
                );
                return [...current, ...uniquePageImages];
            });

            nextCursorRef.current = payload.next_cursor || null;
            const moreAvailable = Boolean(payload.next_cursor);
            hasMoreRef.current = moreAvailable;
            setHasMore(moreAvailable);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Something went wrong while loading pins.",
            );
        } finally {
            isFetchingRef.current = false;
            setIsLoading(false);
        }
    }, []);

    // Load the first page on mount: GET /api/pins?limit=20.
    useEffect(() => {
        void loadNextPage();
    }, [loadNextPage]);

    // Fetch the next cursor page shortly before the user reaches the end.
    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target || !hasMore || error || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    void loadNextPage();
                }
            },
            { rootMargin: "700px 0px" },
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [hasMore, error, isLoading, loadNextPage]);

    const openImage = useCallback((index: number) => {
        setIsImageLoading(true);
        setSelectedIndex(index);
    }, []);

    const closeImage = useCallback(() => {
        setSelectedIndex(null);
        setIsImageLoading(false);
    }, []);

    const nextImage = useCallback(() => {
        if (images.length === 0) return;
        setIsImageLoading(true);
        setSelectedIndex((current) =>
            current === null ? null : (current + 1) % images.length,
        );
    }, [images.length]);

    const previousImage = useCallback(() => {
        if (images.length === 0) return;
        setIsImageLoading(true);
        setSelectedIndex((current) =>
            current === null
                ? null
                : (current - 1 + images.length) % images.length,
        );
    }, [images.length]);

    useEffect(() => {
        if (selectedIndex === null) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case "Escape":
                    closeImage();
                    break;
                case "ArrowRight":
                    nextImage();
                    break;
                case "ArrowLeft":
                    previousImage();
                    break;
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [selectedIndex, closeImage, nextImage, previousImage]);

    useEffect(() => {
        if (selectedIndex === null || images.length < 2) return;

        const next = images[(selectedIndex + 1) % images.length];
        const previous =
            images[(selectedIndex - 1 + images.length) % images.length];

        [next, previous].forEach((image) => {
            if (!image) return;
            const preload = new window.Image();
            preload.src = image.src;
        });
    }, [selectedIndex, images]);

    return (
        <>
            <section className="mx-auto w-full py-4">
                <div className="flex w-full gap-3 sm:gap-4">
                    {imageColumns.map((column, columnIndex) => (
                        <div
                            key={columnIndex}
                            className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4"
                        >
                            {column.map(({ image, index }) => (
                                <GalleryPin
                                    key={image.id}
                                    image={image}
                                    index={index}
                                    shouldReduceMotion={shouldReduceMotion}
                                    onOpen={openImage}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            {error && (
                <div
                    role="alert"
                    className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm text-muted-foreground"
                >
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={() => void loadNextPage()}
                        disabled={isLoading}
                        className="rounded-md border px-3 py-1.5 text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                        Try again
                    </button>
                </div>
            )}

            {hasMore && (
                <div
                    ref={loadMoreRef}
                    aria-hidden="true"
                    className="h-1 w-full"
                />
            )}

            {isLoading && (
                <div
                    className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
                    role="status"
                    aria-live="polite"
                >
                    <Loader2 className="size-4 animate-spin" />
                    <span>
                        {images.length ? "Loading more pins…" : "Loading pins…"}
                    </span>
                </div>
            )}

            {!isLoading && !error && images.length === 0 && !hasMore && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    No pins yet.
                </p>
            )}

            {!hasMore && images.length > 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                    You&apos;ve reached the end.
                </p>
            )}

            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {selectedImage && selectedIndex !== null && (
                            <motion.div
                                key="lightbox"
                                role="dialog"
                                aria-modal="true"
                                aria-label="Image preview"
                                className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-md sm:p-6 lg:p-10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                onClick={(event) => {
                                    if (event.target === event.currentTarget) {
                                        closeImage();
                                    }
                                }}
                            >
                                <motion.div
                                    className="flex max-h-full w-full max-w-5xl flex-col items-center"
                                    initial={
                                        shouldReduceMotion
                                            ? false
                                            : { opacity: 0, scale: 0.97, y: 12 }
                                    }
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={
                                        shouldReduceMotion
                                            ? undefined
                                            : { opacity: 0, scale: 0.98, y: 8 }
                                    }
                                    transition={{ duration: 0.35, ease: EASE }}
                                >
                                    <div className="flex w-full items-center justify-center gap-2 sm:gap-4">
                                        <motion.button
                                            type="button"
                                            aria-label="Previous image"
                                            onClick={previousImage}
                                            whileHover={
                                                shouldReduceMotion
                                                    ? undefined
                                                    : { x: -2, opacity: 0.55 }
                                            }
                                            whileTap={
                                                shouldReduceMotion
                                                    ? undefined
                                                    : { scale: 0.9 }
                                            }
                                            className="shrink-0 p-1 text-foreground transition-opacity duration-200"
                                        >
                                            <ChevronLeft className="size-6 sm:size-7" />
                                        </motion.button>

                                        <div
                                            className="relative flex min-h-40 min-w-0 flex-1 items-center justify-center rounded-2xl"
                                            style={{
                                                backgroundImage:
                                                    selectedBlurhashURL
                                                        ? `url("${selectedBlurhashURL}")`
                                                        : undefined,
                                                backgroundPosition: "center",
                                                backgroundRepeat: "no-repeat",
                                                backgroundSize: "contain",
                                            }}
                                        >
                                            <AnimatePresence>
                                                {isImageLoading && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{
                                                            duration: 0.15,
                                                        }}
                                                        className="absolute inset-0 z-10 flex items-center justify-center"
                                                    >
                                                        <Loader2 className="size-5 animate-spin text-foreground/60" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <AnimatePresence
                                                mode="wait"
                                                initial={false}
                                            >
                                                <motion.img
                                                    key={selectedImage.id}
                                                    src={selectedImage.src}
                                                    alt={selectedImage.alt}
                                                    width={selectedImage.width}
                                                    height={
                                                        selectedImage.height
                                                    }
                                                    draggable={false}
                                                    initial={
                                                        shouldReduceMotion
                                                            ? false
                                                            : { opacity: 0 }
                                                    }
                                                    animate={{
                                                        opacity: isImageLoading
                                                            ? 0
                                                            : 1,
                                                    }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{
                                                        duration: 0.28,
                                                        ease: "easeInOut",
                                                    }}
                                                    onLoad={() =>
                                                        setIsImageLoading(false)
                                                    }
                                                    onError={() =>
                                                        setIsImageLoading(false)
                                                    }
                                                    className="block h-auto max-h-[70dvh] w-auto max-w-full select-none rounded-2xl object-contain"
                                                />
                                            </AnimatePresence>
                                        </div>

                                        <motion.button
                                            type="button"
                                            aria-label="Next image"
                                            onClick={nextImage}
                                            whileHover={
                                                shouldReduceMotion
                                                    ? undefined
                                                    : { x: 2, opacity: 0.55 }
                                            }
                                            whileTap={
                                                shouldReduceMotion
                                                    ? undefined
                                                    : { scale: 0.9 }
                                            }
                                            className="shrink-0 p-1 text-foreground transition-opacity duration-200"
                                        >
                                            <ChevronRight className="size-6 sm:size-7" />
                                        </motion.button>
                                    </div>

                                    <AnimatePresence
                                        mode="wait"
                                        initial={false}
                                    >
                                        <motion.p
                                            key={selectedImage.id}
                                            initial={
                                                shouldReduceMotion
                                                    ? false
                                                    : { opacity: 0, y: 4 }
                                            }
                                            animate={{
                                                opacity: isImageLoading ? 0 : 1,
                                                y: 0,
                                            }}
                                            exit={
                                                shouldReduceMotion
                                                    ? undefined
                                                    : { opacity: 0, y: -4 }
                                            }
                                            transition={{ duration: 0.2 }}
                                            className="mt-5 w-full max-w-2xl truncate px-8 text-center text-xs font-medium uppercase tracking-[0.08em] text-foreground/65 sm:px-10 sm:text-sm"
                                            title={selectedImage.caption}
                                        >
                                            {selectedImage.caption}
                                        </motion.p>
                                    </AnimatePresence>

                                    <div className="mt-4 h-px w-32 overflow-hidden bg-foreground/10 sm:mt-5 sm:w-48">
                                        <motion.div
                                            className="h-full bg-foreground/60"
                                            animate={{
                                                width: `${((selectedIndex + 1) / images.length) * 100}%`,
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: "easeOut",
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </>
    );
}

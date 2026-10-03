"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";

/* =========================================
   DATA
========================================== */

type GalleryImage = {
    id: number;
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
};

const unsplash = (photoId: string, width = 1600) =>
    `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=90`;

const baseImages: Omit<GalleryImage, "id">[] = [
    {
        src: unsplash("1500534623283-312aade485b7"),
        alt: "Mountain landscape",
        caption: "Somewhere between here and nowhere.",
        width: 1600,
        height: 1067,
    },
    {
        src: unsplash("1464822759023-fed622ff2c3b"),
        alt: "Mountain range",
        caption: "The mountains were quiet today.",
        width: 1600,
        height: 1067,
    },
    {
        src: unsplash("1470770841072-f978cf4d019e"),
        alt: "Lake and mountains",
        caption: "A place worth getting lost in.",
        width: 1600,
        height: 1067,
    },
    {
        src: unsplash("1500530855697-b586d89ba3ee"),
        alt: "Forest road",
        caption: "Take the road nobody talks about.",
        width: 1600,
        height: 1067,
    },
    {
        src: unsplash("1441974231531-c6227db76b6e"),
        alt: "Forest",
        caption: "Silence has its own language.",
        width: 1600,
        height: 1067,
    },
    {
        src: unsplash("1507525428034-b723cf961d3e"),
        alt: "Ocean",
        caption: "Where the horizon begins.",
        width: 1600,
        height: 1067,
    },
    {
        src: unsplash("1511497584788-876760111969"),
        alt: "Trees",
        caption: "Green feels different after rain.",
        width: 1600,
        height: 1067,
    },
    {
        src: unsplash("1500534314209-a25ddb2bd429"),
        alt: "Desert",
        caption: "Nothing but dust and distance.",
        width: 1600,
        height: 1067,
    },
    {
        src: unsplash("1493246507139-91e8fad9978e"),
        alt: "Mountain valley",
        caption: "A view worth remembering.",
        width: 1600,
        height: 1067,
    },
    {
        src: unsplash("1500534623283-312aade485b7", 1200),
        alt: "Mountain sunset",
        caption: "The last light of the day.",
        width: 1200,
        height: 800,
    },
];

// 10 base images repeated twice (20 total), unique ids.
// Real project mein bas `baseImages` ko apni list se replace kar do.
const images: GalleryImage[] = Array.from({ length: 20 }, (_, i) => ({
    ...baseImages[i % baseImages.length],
    id: i + 1,
}));

/* =========================================
   CONSTANTS
========================================== */

const EASE = [0.22, 1, 0.36, 1] as const;

/* =========================================
   COMPONENT
========================================== */

export default function Pins() {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);

    const shouldReduceMotion = useReducedMotion();
    const isMobile = useMediaQuery("(max-width: 767px)");

    // true only on the client -> safe to use document.body for the portal
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

    // Masonry columns. Keep the original index so we don't need indexOf().
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
    }, [columnCount]);

    /* ---------- actions ---------- */

    const openImage = useCallback((index: number) => {
        setIsImageLoading(true);
        setSelectedIndex(index);
    }, []);

    const closeImage = useCallback(() => {
        setSelectedIndex(null);
        setIsImageLoading(false);
    }, []);

    const nextImage = useCallback(() => {
        setIsImageLoading(true);
        setSelectedIndex((current) =>
            current === null ? null : (current + 1) % images.length,
        );
    }, []);

    const previousImage = useCallback(() => {
        setIsImageLoading(true);
        setSelectedIndex((current) =>
            current === null
                ? null
                : (current - 1 + images.length) % images.length,
        );
    }, []);

    /* ---------- keyboard + scroll lock ---------- */

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

    /* ---------- preload neighbours for instant next/prev ---------- */

    useEffect(() => {
        if (selectedIndex === null) return;

        const neighbours = [
            images[(selectedIndex + 1) % images.length],
            images[(selectedIndex - 1 + images.length) % images.length],
        ];

        neighbours.forEach((image) => {
            const preload = new window.Image();
            preload.src = image.src;
        });
    }, [selectedIndex]);

    /* =========================================
       RENDER
    ========================================== */

    return (
        <>
            {/* ---------- GALLERY ---------- */}

            <section className="mx-auto w-full py-4">
                <div className="flex  w-full gap-3 sm:gap-4">
                    {imageColumns.map((column, columnIndex) => (
                        <div
                            key={columnIndex}
                            className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4"
                        >
                            {column.map(({ image, index }) => (
                                <motion.button
                                    key={image.id}
                                    type="button"
                                    onClick={() => openImage(index)}
                                    initial={
                                        shouldReduceMotion
                                            ? false
                                            : { opacity: 0, y: 20 }
                                    }
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.08 }}
                                    transition={{ duration: 0.65, ease: EASE }}
                                    whileHover={
                                        shouldReduceMotion
                                            ? undefined
                                            : { y: -2 }
                                    }
                                    className="group relative block w-full overflow-hidden rounded-2xl bg-muted text-left"
                                >
                                    <motion.img
                                        src={image.src}
                                        alt={image.alt}
                                        width={image.width}
                                        height={image.height}
                                        loading="lazy"
                                        decoding="async"
                                        draggable={false}
                                        whileHover={
                                            shouldReduceMotion
                                                ? undefined
                                                : { scale: 1.035 }
                                        }
                                        transition={{
                                            duration: 0.7,
                                            ease: EASE,
                                        }}
                                        className="block shadow-4xl h-auto w-full object-cover"
                                    />

                                    {/* Hover overlay */}
                                    <div className="pointer-events-none absolute inset-0 flex items-end bg-black/0 p-4 opacity-0 transition-all duration-500 group-hover:bg-black/45 group-hover:opacity-100 sm:p-5">
                                        <span
                                            className="block w-full min-w-0 truncate text-[10px] font-medium uppercase tracking-[0.08em] text-white sm:text-xs"
                                            title={image.caption}
                                        >
                                            {image.caption}
                                        </span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- LIGHTBOX (portal -> document.body) ---------- */}

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
                                    {/* Prev | Image | Next (no absolute positioning) */}
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

                                        <div className="relative flex min-w-0 flex-1 items-center justify-center">
                                            {/* Loading spinner */}
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

                                    {/* Caption */}
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

                                    {/* Progress */}
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

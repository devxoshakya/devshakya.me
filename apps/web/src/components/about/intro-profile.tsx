"use client";

import {
    AnimatePresence,
    LayoutGroup,
    MotionConfig,
    motion,
    useReducedMotion,
} from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { FlipRoles } from "@/components/about/flip-roles";
import { Title } from "@devshakya.me/ui/components/title";
import { UserAvatar } from "@/components/user-avatar";
import { SITE } from "@/constants/site";
import { USER } from "@/constants/user";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@devshakya.me/ui/components/tooltip";

const GREETINGS = [
    "Hello",
    "Bonjour",
    "स्वागत है",
    "नमस्कार",
    "Ciao",
    "Olá",
    "おい",
    "Hallå",
    "Guten tag",
] as const;
const GREETING_DURATION_MS = 180;
const IDENTITY_HOLD_MS = 600;
const PROFILE_LAYOUT_DURATION_SECONDS = 0.65;
const CURTAIN_DELAY_SECONDS = 0.78;
const CURTAIN_DURATION_SECONDS = 0.28;
const DETAIL_DELAY_SECONDS = 0.58;
const DETAIL_DURATION_SECONDS = 0.18;
const ROLE_STAGGER_SECONDS = 0.06;
const PROFILE_AVATAR_LAYOUT_ID = "home-profile-avatar";
const PROFILE_NAME_LAYOUT_ID = "home-profile-name";

const profileLayoutTransition = {
    duration: PROFILE_LAYOUT_DURATION_SECONDS,
    ease: [0.77, 0, 0.175, 1],
    type: "tween",
} as const;

const curtainTransition = {
    delay: CURTAIN_DELAY_SECONDS,
    duration: CURTAIN_DURATION_SECONDS,
    ease: [0.23, 1, 0.32, 1],
    type: "tween",
} as const;

const detailTransition = {
    delay: DETAIL_DELAY_SECONDS,
    duration: DETAIL_DURATION_SECONDS,
    ease: [0.23, 1, 0.32, 1],
    type: "tween",
} as const;

const roleTransition = {
    ...detailTransition,
    delay: DETAIL_DELAY_SECONDS + ROLE_STAGGER_SECONDS,
} as const;

type IntroPhase = "greetings" | "identity" | "profile";

interface ProfileHeaderProps {
    shouldAnimateDetails: boolean;
}

type IntroMode = "pending" | "play" | "skip";

interface IntroProfileProps {
    mode: IntroMode;
    onComplete?: () => void;
}

type CodingStats = {
    is_active: boolean;
    total_seconds: number;
    daily_seconds: number;
    stale?: boolean;
};

function CodingStatusIndicator() {
    const [stats, setStats] = useState<CodingStats | null>(null);
    const [requestFailed, setRequestFailed] = useState(false);

    useEffect(() => {
        let stopped = false;
        let controller: AbortController | undefined;
        let timeout: number | undefined;

        async function loadStats() {
            controller = new AbortController();

            try {
                const response = await fetch("/api/stats/coding", {
                    headers: { accept: "application/json" },
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(
                        `Coding stats request failed: ${response.status}`,
                    );
                }

                const data = (await response.json()) as CodingStats;

                if (
                    typeof data.is_active !== "boolean" ||
                    typeof data.total_seconds !== "number" ||
                    !Number.isFinite(data.total_seconds) ||
                    typeof data.daily_seconds !== "number" ||
                    !Number.isFinite(data.daily_seconds)
                ) {
                    throw new Error("Invalid coding stats response");
                }

                setStats(data);
                setRequestFailed(false);
            } catch {
                if (!controller.signal.aborted) {
                    setRequestFailed(true);
                }
            } finally {
                if (!stopped) {
                    timeout = window.setTimeout(() => {
                        void loadStats();
                    }, 60_000);
                }
            }
        }

        void loadStats();

        return () => {
            stopped = true;
            controller?.abort();

            if (timeout !== undefined) {
                window.clearTimeout(timeout);
            }
        };
    }, []);

    const indicatorColor = !stats
        ? "neutral"
        : stats.is_active
          ? "green"
          : stats.daily_seconds > 0
            ? "yellow"
            : "red";

    // Label shown in the tooltip and used for the aria-label.
    // (The previous code referenced an undefined `status`, which resolved to window.status, an empty string.)
    const statusLabel = !stats
        ? requestFailed
            ? "Unavailable"
            : "Loading"
        : stats.is_active
          ? "Online"
          : stats.daily_seconds > 0
            ? "Idle"
            : "Offline";

    const indicatorStyles = {
        neutral: {
            border: "border-neutral-400 dark:border-neutral-600",
            dot: "bg-neutral-400 dark:bg-neutral-500",
            text: "text-muted-foreground",
        },
        green: {
            border: "border-neutral-250 dark:border-neutral-750",
            dot: "bg-green-600 dark:bg-green-500",
            text: "text-green-700 dark:text-green-400",
        },
        yellow: {
            border: "border-neutral-250 dark:border-neutral-750",
            dot: "bg-yellow-600 dark:bg-yellow-400",
            text: "text-yellow-700 dark:text-yellow-400",
        },
        red: {
            border: "border-neutral-250 dark:border-neutral-750",
            dot: "bg-red-600 dark:bg-red-500",
            text: "text-red-700 dark:text-red-400",
        },
    }[indicatorColor];

    const totalHours = stats
        ? `${(stats.total_seconds / 3600).toFixed(1)} hours`
        : "—";

    const dailyMinutes = stats
        ? `${Math.floor(stats.daily_seconds / 60)} minutes`
        : "—";

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <button
                            type="button"
                            aria-label={`Coding status: ${statusLabel}`}
                            className={`absolute -bottom-0.5 -left-0.5 z-10 grid size-4 place-items-center rounded-full border bg-white shadow-sm dark:bg-neutral-950 ${indicatorStyles.border} outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                        >
                            <span
                                aria-hidden="true"
                                className={`size-2.5 rounded-full ${indicatorStyles.dot}`}
                            />
                        </button>
                    }
                />

                {/* [&_.rotate-45]:hidden hides the arrow (the diamond) the shadcn tooltip renders. */}
                <TooltipContent className="max-w-40 rounded-md border border-dashed border-neutral-300 bg-white p-1.5 text-neutral-950 shadow-lg dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 [&_.rotate-45]:hidden">
                    <table className="w-full table-fixed border-collapse text-[10px] leading-3.5">
                        <tbody>
                            <tr className="border-b border-dashed border-neutral-200 dark:border-neutral-800">
                                <th
                                    scope="row"
                                    className="w-1/2 border-r border-dashed border-neutral-200 dark:border-neutral-800 py-1 pr-2 text-left font-normal text-neutral-500 dark:text-neutral-400"
                                >
                                    Status
                                </th>
                                <td className="py-1 pl-2 text-right">
                                    <span
                                        className={`whitespace-nowrap font-medium ${indicatorStyles.text}`}
                                    >
                                        {statusLabel}
                                    </span>
                                </td>
                            </tr>

                            <tr className="border-b border-dashed border-neutral-200 dark:border-neutral-800">
                                <th
                                    scope="row"
                                    className="border-r border-dashed border-neutral-200 dark:border-neutral-800 py-1 pr-2 text-left font-normal text-neutral-500 dark:text-neutral-400"
                                >
                                    Total coded
                                </th>
                                <td className="whitespace-nowrap py-1 pl-2 text-right font-medium tabular-nums">
                                    {totalHours}
                                </td>
                            </tr>

                            <tr>
                                <th
                                    scope="row"
                                    className="border-r border-dashed border-neutral-200 dark:border-neutral-800 pt-1 pr-2 text-left font-normal text-neutral-500 dark:text-neutral-400"
                                >
                                    Coded today
                                </th>
                                <td className="whitespace-nowrap pt-1 pl-2 text-right font-medium tabular-nums">
                                    {dailyMinutes}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

const ProfileHeader = ({ shouldAnimateDetails }: ProfileHeaderProps) => (
    <div className="relative z-2 flex items-center gap-5">
        <div className="relative w-fit">
            <UserAvatar
                layoutId={
                    shouldAnimateDetails ? PROFILE_AVATAR_LAYOUT_ID : undefined
                }
                layoutTransition={
                    shouldAnimateDetails ? profileLayoutTransition : undefined
                }
            />

            <CodingStatusIndicator />
        </div>

        <div>
            <Title className="font-sans tracking-tight whitespace-nowrap">
                <motion.span
                    layoutId={
                        shouldAnimateDetails
                            ? PROFILE_NAME_LAYOUT_ID
                            : undefined
                    }
                    className="inline-block"
                    transition={
                        shouldAnimateDetails
                            ? { layout: profileLayoutTransition }
                            : undefined
                    }
                >
                    Dev
                </motion.span>{" "}
                <motion.span
                    className="inline-block"
                    initial={
                        shouldAnimateDetails
                            ? {
                                  opacity: 0,
                                  transform: "translate3d(0, 2px, 0)",
                              }
                            : false
                    }
                    animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
                    transition={detailTransition}
                >
                    Shakya
                </motion.span>
            </Title>

            <motion.div
                initial={
                    shouldAnimateDetails
                        ? { opacity: 0, transform: "translate3d(0, 4px, 0)" }
                        : false
                }
                animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
                transition={roleTransition}
            >
                <FlipRoles>{USER.roles}</FlipRoles>
            </motion.div>
        </div>
    </div>
);

const IntroProfile = ({ mode, onComplete }: IntroProfileProps) => {
    const shouldReduceMotion = useReducedMotion();
    const [phase, setPhase] = useState<IntroPhase>("greetings");
    const [greetingIndex, setGreetingIndex] = useState(0);
    const [isIntroComplete, setIsIntroComplete] = useState(false);
    const shouldPlayIntro = mode === "play" && !shouldReduceMotion;
    const visiblePhase = shouldPlayIntro ? phase : "profile";
    const shouldLockScroll =
        mode === "pending" || (shouldPlayIntro && !isIntroComplete);

    useLockBodyScroll(shouldLockScroll);

    useEffect(() => {
        if (!shouldPlayIntro) {
            return;
        }

        const timers = GREETINGS.slice(1).map((_, index) =>
            window.setTimeout(
                () => setGreetingIndex(index + 1),
                (index + 1) * GREETING_DURATION_MS,
            ),
        );
        const identityStart = GREETINGS.length * GREETING_DURATION_MS;

        timers.push(
            window.setTimeout(() => setPhase("identity"), identityStart),
            window.setTimeout(
                () => setPhase("profile"),
                identityStart + IDENTITY_HOLD_MS,
            ),
        );

        return () => {
            for (const timer of timers) {
                window.clearTimeout(timer);
            }
        };
    }, [shouldPlayIntro]);

    useEffect(() => {
        if (mode === "play" && !shouldPlayIntro) {
            onComplete?.();
        }
    }, [mode, onComplete, shouldPlayIntro]);

    useEffect(() => {
        if (mode === "play" && isIntroComplete) {
            onComplete?.();
        }
    }, [isIntroComplete, mode, onComplete]);

    return (
        <MotionConfig reducedMotion="user">
            <LayoutGroup id="home-profile-intro">
                <div>
                    {mode === "pending" ? (
                        <div
                            data-intro-pending=""
                            aria-hidden="true"
                            className="bg-background pointer-events-auto fixed -inset-1 z-3 touch-none"
                        />
                    ) : null}

                    {shouldPlayIntro && visiblePhase !== "profile" ? (
                        <Image
                            src={SITE.AUTHOR.AVATAR}
                            alt=""
                            width={60}
                            height={60}
                            aria-hidden="true"
                            className="pointer-events-none fixed size-px opacity-0"
                            priority
                        />
                    ) : null}

                    {mode === "play" ? (
                        <AnimatePresence
                            initial={false}
                            onExitComplete={() => setIsIntroComplete(true)}
                        >
                            {visiblePhase === "profile" ? null : (
                                <motion.div
                                    key="intro-backdrop"
                                    data-intro-backdrop=""
                                    aria-hidden="true"
                                    className="bg-background pointer-events-auto fixed -inset-1 z-1 touch-none will-change-transform"
                                    exit={{
                                        transform: "translate3d(0, -100%, 0)",
                                    }}
                                    transition={curtainTransition}
                                />
                            )}
                        </AnimatePresence>
                    ) : null}

                    {shouldPlayIntro && visiblePhase === "greetings" ? (
                        <p
                            aria-hidden="true"
                            className="text-foreground pointer-events-none fixed inset-0 z-2 flex items-center justify-center gap-1.5 text-2xl leading-snug font-semibold tracking-tight"
                        >
                            <span className="size-1.5 rounded-full bg-current" />
                            <span>{GREETINGS[greetingIndex]}</span>
                        </p>
                    ) : null}

                    {shouldPlayIntro && visiblePhase === "identity" ? (
                        <div
                            aria-hidden="true"
                            className="text-foreground pointer-events-none fixed inset-0 z-2 flex items-center justify-center gap-2 text-2xl leading-snug tracking-tight"
                        >
                            <span className="font-medium">I’m</span>
                            <UserAvatar
                                layoutId={PROFILE_AVATAR_LAYOUT_ID}
                                layoutTransition={profileLayoutTransition}
                                size={38}
                            />
                            <motion.span
                                layoutId={PROFILE_NAME_LAYOUT_ID}
                                className="inline-block font-semibold"
                                transition={{ layout: profileLayoutTransition }}
                            >
                                Dev
                            </motion.span>
                        </div>
                    ) : null}

                    {visiblePhase === "profile" ? (
                        <ProfileHeader shouldAnimateDetails={shouldPlayIntro} />
                    ) : null}
                </div>
            </LayoutGroup>
        </MotionConfig>
    );
};

export { IntroProfile };
export type { IntroMode };

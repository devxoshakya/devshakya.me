import { CalendarDaysIcon, MailIcon } from "lucide-react";
import { Suspense } from "react";
import type { Route } from "next";

import {
    GitHubContributions,
    GitHubContributionsFallback,
} from "@/components/about/github-contributions";
import { IntroSection } from "@/components/about/intro-section";
import { ICON } from "@/components/Icon";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@devshakya.me/ui/components/button";
import { Callout } from "@devshakya.me/ui/components/callout";
import { LINK } from "@/constants/links";
import { getGitHubContributions } from "@/lib/github/contributions";

const AboutSection = () => {
    const contributions = getGitHubContributions();

    return (
        <IntroSection>
            <div className="prose text-muted-foreground prose-p:my-2 dark:prose-invert max-w-full text-sm leading-6 font-normal">
                <p>
                    I’m a software engineer who enjoys building fast,
                    well-crafted products across{" "}
                    <AppLink
                        className="inline-flex items-center gap-1 translate-y-0.5"
                        href={"https://nextjs.org/"}
                        target="_blank"
                    >
                        <ICON.nextjs className="h-4 w-4 pt-0.5 mx-0.5" />
                        Next.js
                    </AppLink>
                    , backend systems, cloud infrastructure, and AI.
                </p>

                <p>
                    Currently exploring{" "}
                    <AppLink
                        className="inline-flex items-center gap-1 translate-y-0.5"
                        href={"https://ollama.com/"}
                        target="_blank"
                    >
                        <ICON.ollama className="size-4 mx-0.5" />
                        AI engineering
                    </AppLink>
                    ,{" "}
                    <AppLink
                        className="inline-flex items-center gap-1 translate-y-0.5"
                        href={"https://www.aws.com/"}
                        target="_blank"
                    >
                        <ICON.aws className="size-4 mx-0.5 translate-y-0.5" />
                        cloud
                    </AppLink>
                    , and scalable backend systems.
                </p>
            </div>
            <Callout className="space-y-1 p-1">
                <Suspense fallback={<GitHubContributionsFallback />}>
                    <GitHubContributions contributions={contributions} />
                </Suspense>
                <div className="flex flex-col gap-3 p-2">
                    <p>
                        Interested in working together? Check out my{" "}
                        <AppLink
                            href={LINK.RESUME as Route}
                            target="_blank"
                            className="text-muted-foreground text-sm font-medium inline-flex min-w-17.25"
                            external
                        >
                            Resume
                        </AppLink>
                    </p>
                    <div className="flex flex-row items-center gap-2">
                        <Button
                            nativeButton={false}
                            render={
                                <AppLink href={LINK.CALENDLY} target="_blank" />
                            }
                        >
                            <CalendarDaysIcon />
                            Book an intro call
                        </Button>
                        <Button
                            variant="outline"
                            nativeButton={false}
                            render={
                                <AppLink
                                    href={`mailto:${LINK.EMAIL}`}
                                    target="_blank"
                                />
                            }
                        >
                            <MailIcon />
                            Send an email
                        </Button>
                    </div>
                </div>
            </Callout>
        </IntroSection>
    );
};

export { AboutSection };

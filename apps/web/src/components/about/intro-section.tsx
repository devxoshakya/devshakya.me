"use client";

import { useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";

import { IntroProfile } from "@/components/about/intro-profile";
import type { IntroMode } from "@/components/about/intro-profile";
import { Section } from "@devshakya.me/ui/components/section";

const HOME_INTRO_SESSION_KEY = "home-intro-started";
let hasHomeIntroStarted = false;

interface IntroSectionProps {
  children: ReactNode;
}

const IntroSection = ({ children }: IntroSectionProps) => {
  const [introMode, setIntroMode] = useState<IntroMode>(
    hasHomeIntroStarted ? "skip" : "pending"
  );

  useLayoutEffect(() => {
    try {
      hasHomeIntroStarted ||=
        window.sessionStorage.getItem(HOME_INTRO_SESSION_KEY) === "true";
    } catch {
      // Fall back to the in-memory flag when storage is unavailable.
    }

    if (hasHomeIntroStarted) {
      setIntroMode("skip");
      return;
    }

    hasHomeIntroStarted = true;

    try {
      window.sessionStorage.setItem(HOME_INTRO_SESSION_KEY, "true");
    } catch {
      // The in-memory flag still prevents repeats during client navigation.
    }

    setIntroMode("play");
  }, []);

  return (
    <Section
      id="about"
      className={ "animate-none space-y-4"}
    >
      <IntroProfile mode={"play"} />
      {children}
    </Section>
  );
};

export { IntroSection };

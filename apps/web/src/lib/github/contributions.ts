import "server-only";
import { execSync } from "node:child_process";

import { unstable_cache } from "next/cache";

import type { Activity } from "@/components/about/contribution-graph";
import { GITHUB } from "@/constants/links";
import { ENV } from "@/env";

interface GitHubContributionsResponse {
  contributions: Activity[];
}

export const getGitHubContributions = unstable_cache(
  async () => {
    const res = await fetch(
      `https://portfolio-api-ochre-three.vercel.app/stats/github/contributions`
    );
    const data = (await res.json()) as GitHubContributionsResponse;
    return data.contributions;
  },
  ["github-contributions"],
  { revalidate: 86_400 }
);


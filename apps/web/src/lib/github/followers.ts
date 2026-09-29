import "server-only";
import { unstable_cache } from "next/cache";

import { GITHUB } from "@/constants/links";

export const getFollowerCount = unstable_cache(
  async () => {
    try {
      const response = await fetch(
        `https://api.github.com/users/${GITHUB.user}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (!response.ok) {
        return 0;
      }

      const json = (await response.json()) as {
        followers?: number;
      };

      return Number(json?.followers) || 0;
    } catch {
      return 0;
    }
  },
  ["github-follower-count"],
  { revalidate: 86_400 }
);
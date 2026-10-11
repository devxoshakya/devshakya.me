import "server-only";
import { unstable_cache } from "next/cache";

export const getFollowerCount = unstable_cache(
  async () => {
    try {
      const response = await fetch(
        `https://portfolio-api-ochre-three.vercel.app/stats/github/followers`,
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
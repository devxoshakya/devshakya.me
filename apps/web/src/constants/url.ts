import {ENV} from "@/env";

export const FALLBACK_SITE_ORIGIN = "https://www.aniketpawar.com" as const;

export const getBaseUrl = () => {
  if (ENV.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }
  if (ENV.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${ENV.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return ENV.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_ORIGIN;
};

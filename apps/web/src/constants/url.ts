import {ENV} from "@/env";

export const FALLBACK_SITE_ORIGIN = "https://devxoshakya.xyz" as const;

const normalizeOrigin = (value: string) =>
  value
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

export const getBaseUrl = () => {
  if (ENV.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }
  if (ENV.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${normalizeOrigin(
      ENV.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    )}`;
  }
  if (ENV.NEXT_PUBLIC_SITE_URL) {
    return `https://${normalizeOrigin(ENV.NEXT_PUBLIC_SITE_URL)}`;
  }
  return FALLBACK_SITE_ORIGIN;
};

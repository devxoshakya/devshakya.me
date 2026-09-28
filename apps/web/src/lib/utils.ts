
import { SITE } from "@/constants/site";
import { cn } from "cn";

export { cn };

export const absoluteUrl = (path: string) => `${SITE.URL}${path}`;

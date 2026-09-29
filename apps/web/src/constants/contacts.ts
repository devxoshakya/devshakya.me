import { LINK } from "@/constants/links";

import type { Contact } from "@/types/contacts";

export const CONTACTS = [
  {
    icon: "github",
    link: {
      display: "@devxoshakya",
      url: LINK.GITHUB,
    },
    title: "GitHub",
  },
  {
    icon: "linkedin",
    link: {
      display: "@devshakya",
      url: LINK.LINKEDIN,
    },
    title: "LinkedIn",
  },
  {
    icon: "leetcode",
    link: {
      display: "@devxoshakya",
      url: LINK.LEETCODE,
    },
    title: "LeetCode",
  },
  {
    icon: "telegram",
    link: {
      display: "@devshakya",
      url: LINK.TELEGRAM,
    },
    title: "Telegram",
  },
  {
    icon: "gfg",
    link: {
      display: "@devxoshakya",
      url: LINK.GFG,
    },
    title: "GeeksforGeeks",
  },
  {
    icon: "instagram",
    link: {
      display: "@devshakya",
      url: LINK.INSTAGRAM,
    },
    title: "Instagram",
  },
] as const satisfies readonly Contact[];
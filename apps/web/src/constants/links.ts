export const GITHUB = {
  branch: "main",
  org: "shadcn-labs",
  repo: "devshakya.me",
  user: "devxoshakya",
} as const;

const GITHUB_URL = `https://github.com/${GITHUB.user}`;

export const LINK = {
  BLUESKY: "https://bsky.app/profile/alaymanguy.bsky.social",
  CALENDLY: "https://cal.com/devxoshakya",
  LEETCODE: "https://leetcode.com/devxoshakya",
  GFG: "https://auth.geeksforgeeks.org/user/devxoshakya",
  INSTAGRAM: "https://instagram.com/devxoshakya",
  DAILYDEV: "https://daily.dev/devxoshakya",
  DISCORD: "https://discordapp.com/users/393317827186130964",
  EMAIL: "devxoshakya@gmail.com",
  GITHUB: GITHUB_URL,
  GITHUB_REPO: `https://github.com/${GITHUB.user}/${GITHUB.repo}`,
  LICENSE: `${GITHUB_URL}/blob/${GITHUB.branch}/LICENSE`,
  LINKEDIN: "https://www.linkedin.com/in/devxoshakya",
  PEERLIST: "https://peerlist.io/aniket_pawar",
  RESUME: "/resume.pdf",
  SHADCN_LABS: "https://shadcn-labs.com",
  SHADCN_UI: "https://ui.shadcn.com",
  TELEGRAM: "https://t.me/devxoshakya",
  TOKSCALE: "https://tokscale.ai",
  TOPMATE: "https://topmate.io/aniket_pawar",
  TWITTER: "https://x.com/alaymanguy",
  X: "https://x.com/alaymanguy",
  X_SHADCN_LABS: "https://x.com/shadcnlabs",
  YOUTUBE: "https://youtube.com/@alaymanguy",
} as const;

const STORAGE_URL =
  "https://yffrvzi8zwbljfuj.public.blob.vercel-storage.com/portfolio-website";

export const ASSETS = {
  CRUD_DIALOG_ANIMATION: `${STORAGE_URL}/crud_dialog_animation.mp4`,
  FIRE: `${STORAGE_URL}/fogonovo.gif`,
  FOUNDER_LETTER_ANIMATION: `${STORAGE_URL}/founder_letter_animation.mp4`,
  MACBOOK_AIR: `${STORAGE_URL}/macbook_air.webp`,
  SAMSUNG_MONITOR: `${STORAGE_URL}/samsung_monitor.avif`,
};

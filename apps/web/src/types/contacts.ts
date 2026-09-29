export type ContactIconKey =
  | "bluesky"
  | "dailydev"
  | "discord"
  | "github"
  | "instagram"
  | "leetcode"
  | "linkedin"
  | "gfg"
  | "telegram"
  | "topmate"
  | "x"
  | "youtube";

export interface ContactLink {
  display: string;
  url: string;
}

export interface Contact {
  title: string;
  icon: ContactIconKey;
  link: ContactLink;
}

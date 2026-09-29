import type { IconProps } from "@/components/icons";
import { Icons } from "@/components/icons";
import { CONTACTS } from "@/constants/contacts";
import type { Contact, ContactIconKey } from "@/types/contacts";

const CONTACT_ICONS: Record<
  ContactIconKey,
  (props: IconProps) => React.JSX.Element
> = {
  bluesky: Icons.bluesky,
  dailydev: Icons.dailydev,
  discord: Icons.discord,
  gfg: Icons.gfg,
  github: Icons.github,
  instagram: Icons.instagram,
  leetcode: Icons.leetcode,
  linkedin: Icons.linkedin,
  telegram: Icons.telegram,
  topmate: Icons.topmate,
  x: Icons.x,
  youtube: Icons.youtube,
};

export type ResolvedContact = Omit<Contact, "icon"> & {
  icon: (props: IconProps) => React.JSX.Element;
};

export const resolveContacts = (): ResolvedContact[] =>
  CONTACTS.map((contact) => ({
    ...contact,
    icon: CONTACT_ICONS[contact.icon],
  }));

export type SectionId =
  | "about"
  | "blog"
  | "home"
  | "pins";

export interface NavItem {
  href: string;
  id: SectionId;
  label: string;
}

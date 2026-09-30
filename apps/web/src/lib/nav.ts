import { ROUTES } from "@/constants/routes";
import { NAV_STANDALONE } from "@/constants/site";
import type { NavItem, SectionId } from "@/types/nav";

const SECTION_ROUTES: { id: SectionId; route: string }[] = [
  { id: "blog", route: ROUTES.BLOG },
  { id: "about", route: ROUTES.ABOUT },
  { id: "pins", route: ROUTES.PINS },
];

export const getActiveSection = (pathname: string): SectionId | null => {
  if (pathname === ROUTES.HOME) {
    return "home";
  }

  for (const { id, route } of SECTION_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return id;
    }
  }

  return null;
};

export const getHomeNavItem = (): NavItem =>
  NAV_STANDALONE.find((item) => item.id === "home") ?? {
    href: ROUTES.HOME,
    id: "home",
    label: "home",
  };

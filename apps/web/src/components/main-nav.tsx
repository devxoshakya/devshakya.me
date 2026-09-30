"use client";

import { usePathname } from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@devshakya.me/ui/components/navigation-menu";

import { ROUTES } from "@/constants/routes";
import { getActiveSection, getHomeNavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { SectionId } from "@/types/nav";

const homeItem = getHomeNavItem();

const navLinkClass = (id: string, activeSection: SectionId | null) =>
  cn(
    "text-sm transition-colors",
    activeSection === id
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground"
  );

const MainNav = () => {
  const pathname = usePathname();
  const activeSection = getActiveSection(pathname);

  return (
    <div className="flex items-center">
      <nav className="flex items-center">
        <NavigationMenu>
          <NavigationMenuList>
            {/* Home */}
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(
                  navLinkClass(homeItem.id, activeSection),
                  "-ml-2.5"
                )}
                href={homeItem.href}
              >
                {homeItem.label}
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Blog */}
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navLinkClass("blog", activeSection)}
                href={ROUTES.BLOG}
              >
                blog
              </NavigationMenuLink>
            </NavigationMenuItem>

           

            {/* About */}
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navLinkClass("about", activeSection)}
                href={ROUTES.ABOUT}
              >
                about
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Pins */}
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navLinkClass("pins", activeSection)}
                href={ROUTES.PINS}
              >
                pins.
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    </div>
  );
};

export { MainNav };
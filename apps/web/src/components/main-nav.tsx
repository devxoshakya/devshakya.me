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

            {/* Work */}
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navLinkClass("work", activeSection)}
                href={ROUTES.WORK}
              >
                work
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Projects */}
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navLinkClass("projects", activeSection)}
                href={ROUTES.PROJECTS}
              >
                projects
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

            {/* Contact */}
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navLinkClass("contact", activeSection)}
                href={ROUTES.CONTACT}
              >
                contact
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    </div>
  );
};

export { MainNav };
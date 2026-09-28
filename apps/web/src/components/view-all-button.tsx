import { ArrowUpRightIcon } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { Button } from "@devshakya.me/ui/components/button";
import { cn } from "@/lib/utils";

export const ViewAllButton = ({
  href,
  className,
}: {
  href: string;
  className?: string;
}) => (
  <Button
    variant="secondary"
    className={cn("group", className)}
    nativeButton={false}
    render={
      <AppLink
        href={href}
      />
    }
  >
    View all
    <ArrowUpRightIcon className="size-4 transition-transform duration-300 group-hover:rotate-45" />
  </Button>
);

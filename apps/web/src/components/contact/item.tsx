import { AppLink } from "@/components/ui/app-link";
import type { GlimpseData } from "@/components/ui/glimpse/types";
import type { ResolvedContact } from "@/lib/contacts";
import { cn } from "@/lib/utils";
import type { Route } from "next";

interface ContactItemProps
  extends ResolvedContact, Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  preview?: GlimpseData | null;
}

const ContactItem = ({
  title,
  icon,
  link,
  preview,
  className,
  ...attr
}: ContactItemProps) => (
  <div
    className={cn(
      "py-2 flex items-center justify-start gap-4 transition-[border-color,opacity] duration-50 hover:opacity-100 group-hover:opacity-30",
      className
    )}
    {...attr}
  >
    {icon && title && icon({ className: "size-4" })}
    <span>
      {link?.url && (
        <AppLink
          className="text-muted-foreground text-sm font-normal"
          href={link?.url as Route}
          target="_blank"
          external
          preview={preview}
        >
          {link?.display}
        </AppLink>
      )}
      {!link?.url && (
        <span className="text-muted-foreground text-sm font-normal">
          {"link not found"}
        </span>
      )}
    </span>
  </div>
);

export { ContactItem };

import { getLastUpdated } from "@/lib/github/contributions";
import Logo from "@/components/logo";
import { DottedSeparator } from "@/components/separator";

const SiteFooter = () => (
  <footer className="mt-auto animate-slide-in delay-700 view-container px-4">
    <div className="flex justify-center pb-4">
      <Logo
        aria-label="Home"
        role="img"
        className="text-foreground h-12 mb-5 mt-5 w-auto"
      />
    </div>
    <DottedSeparator className="mb-3" />
    <div className="flex items-center justify-between pt-3 pb-[calc(env(safe-area-inset-bottom,0)+0.75rem)]">
      <p className="text-muted-foreground text-xs">
        Last updated · {getLastUpdated()}
      </p>
      <p className="text-muted-foreground text-xs">
        &copy; {new Date().getFullYear()} <span>Aniket Pawar</span>
      </p>
    </div>
  </footer>
);

export { SiteFooter };

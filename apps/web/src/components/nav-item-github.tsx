import { Icons } from "@/components/icons";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@devshakya.me/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@devshakya.me/ui/components/tooltip";
import { LINK } from "@/constants/links";
import { getFollowerCount } from "@/lib/github/followers";

const NavItemGitHub = async () => {
  const followerCount = await getFollowerCount();
  console.log("followerCount", followerCount);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            nativeButton={false}
            render={
              <AppLink
                href={LINK.GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <Icons.github />
          </Button>
        }
      />
      <TooltipContent side="bottom">
        {new Intl.NumberFormat("en-US").format(followerCount)} followers
      </TooltipContent>
    </Tooltip>
  );
};

export { NavItemGitHub };

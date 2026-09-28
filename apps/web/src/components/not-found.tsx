import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@devshakya.me/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@devshakya.me/ui/components/empty";
import { Title } from "@devshakya.me/ui/components/title";
import { ROUTES } from "@/constants/routes";

const NotFound = () => (
  <Empty className="gap-6">
    <EmptyHeader className="gap-3">
      <Title className="text-8xl font-black" render={<h1>404</h1>} />
      <EmptyTitle className="text-2xl font-sans">Page Not Found</EmptyTitle>
      <EmptyDescription className="text-base">
        Oops! The page you&apos;re looking for might have been moved or
        doesn&apos;t exist.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button
        size="lg"
        nativeButton={false}
        render={<Link href={ROUTES.HOME} />}
      >
        <ArrowLeftIcon /> Back to home
      </Button>
    </EmptyContent>
  </Empty>
);

export { NotFound };

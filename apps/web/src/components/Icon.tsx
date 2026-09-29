import type { ComponentProps } from "react";
import StackIcon from "tech-stack-icons";
import { SiArgo, SiJenkins } from "react-icons/si";
import { useTheme } from "next-themes";


type IconProps = ComponentProps<"svg">;

type TechIconProps = {
    className?: string;
};

/**
 * Tech Stack Icons
 *
 * Light/dark variants are handled with Tailwind:
 * - light variant → shown in light mode
 * - dark variant  → shown in dark mode
 *
 * No useTheme() required, so this remains safe to use
 * from Server Components.
 */
function TechIcon({
    name,
    className,
}: {
    name: Parameters<typeof StackIcon>[0]["name"];
    className?: string;
}) {

    const { theme } = useTheme();

    return (
        <>
            {" "}

            {
                theme === "dark" ? (
                    <StackIcon
                        name={name}
                        variant="dark"
                        className={className}
                    />
                ) : (
                    <StackIcon
                        name={name}
                        variant="light"
                        className={className}
                    />
                )
            }
            {/* <span className="inline-flex">
                <span className="dark:hidden">
                    <StackIcon
                        name={name}
                        variant="light"
                        className={className}
                    />
                </span>

                <span className="hidden dark:inline-flex">
                    <StackIcon
                        name={name}
                        variant="dark"
                        className={className}
                    />
                </span>
            </span> */}
        </>
    );
}

function SimpleIcon({
    icon: Icon,
    className,
}: {
    icon: React.ComponentType<IconProps>;
    className?: string;
}) {
    return <Icon className={className} aria-hidden />;
}

export const ICON = {
    github: (props: TechIconProps) => <TechIcon name="github" {...props} />,

    gitlab: (props: TechIconProps) => <TechIcon name="gitlab" {...props} />,

    docker: (props: TechIconProps) => <TechIcon name="docker" {...props} />,

    kubernetes: (props: TechIconProps) => (
        <TechIcon name="kubernetes" {...props} />
    ),

    jenkins: ({ className }: TechIconProps) => (
        <SimpleIcon icon={SiJenkins} className={className} />
    ),

    argocd: ({ className }: TechIconProps) => (
        <SimpleIcon icon={SiArgo} className={className} />
    ),

    terraform: (props: TechIconProps) => (
        <TechIcon name="terraform" {...props} />
    ),

    linux: (props: TechIconProps) => <TechIcon name="linux" {...props} />,

    bash: (props: TechIconProps) => <TechIcon name="bash" {...props} />,

    git: (props: TechIconProps) => <TechIcon name="git" {...props} />,

    javascript: (props: TechIconProps) => <TechIcon name="js" {...props} />,

    typescript: (props: TechIconProps) => (
        <TechIcon name="typescript" {...props} />
    ),

    python: (props: TechIconProps) => <TechIcon name="python" {...props} />,

    java: (props: TechIconProps) => <TechIcon name="java" {...props} />,

    react: (props: TechIconProps) => <TechIcon name="react" {...props} />,

    nextjs: (props: TechIconProps) => <TechIcon name="nextjs" {...props} />,

    hono: (props: TechIconProps) => <TechIcon name="hono" {...props} />,

    cloudflare: (props: TechIconProps) => (
        <TechIcon name="cloudflare" {...props} />
    ),

    aws: (props: TechIconProps) => <TechIcon name="aws" {...props} />,

    gcp: (props: TechIconProps) => <TechIcon name="gcloud" {...props} />,

    zustand: (props: TechIconProps) => <TechIcon name="zustand" {...props} />,

    shadcn: (props: TechIconProps) => <TechIcon name="shadcnui" {...props} />,

    tailwindcss: (props: TechIconProps) => (
        <TechIcon name="tailwindcss" {...props} />
    ),

    zod: (props: TechIconProps) => <TechIcon name="zod" {...props} />,

    express: (props: TechIconProps) => <TechIcon name="expressjs" {...props} />,

    nodejs: (props: TechIconProps) => <TechIcon name="nodejs" {...props} />,

    bun: (props: TechIconProps) => <TechIcon name="bunjs" {...props} />,

    prisma: (props: TechIconProps) => <TechIcon name="prisma" {...props} />,

    postgresql: (props: TechIconProps) => (
        <TechIcon name="postgresql" {...props} />
    ),

    mongodb: (props: TechIconProps) => <TechIcon name="mongodb" {...props} />,

    redis: (props: TechIconProps) => <TechIcon name="redis" {...props} />,

    claude: (props: TechIconProps) => <TechIcon name="claude" {...props} />,

    opencode: (props: TechIconProps) => <TechIcon name="opencode" {...props} />,

    fastapi: (props: TechIconProps) => <TechIcon name="fastapi" {...props} />,

    langchain: (props: TechIconProps) => (
        <TechIcon name="langchain" {...props} />
    ),

    langgraph: (props: TechIconProps) => (
        <TechIcon name="langgraph" {...props} />
    ),

    llamaindex: (props: TechIconProps) => (
        <TechIcon name="llamaindex" {...props} />
    ),

    huggingface: (props: TechIconProps) => (
        <TechIcon name="huggingface" {...props} />
    ),

    gemini: (props: TechIconProps) => <TechIcon name="gemini" {...props} />,

    vercel: (props: TechIconProps) => <TechIcon name="vercel" {...props} />,
} as const;

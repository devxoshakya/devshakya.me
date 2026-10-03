import { ICON } from "@/components/Icon"


interface IconData {
    Component: React.FC<{ className?: string }>
    href: string
    className: string
    label: string
}
export const iconData: IconData[] = [
    {
        Component: ICON["nextjs-grey"],
        href: 'https://nextjs.org',
        className: 'size-10 grayscale',
        label: 'Next.js',
    },
    {
        Component: ICON["tailwindcss-grey"],
        href: 'https://tailwindcss.com',
        className: 'size-10 grayscale',
        label: 'Tailwind',
    },
    {
        Component: ICON["shadcn-grey"],
        href: 'https://shadcn.dev',
        className: 'size-10 grayscale',
        label: 'shadcn',
    },
    {
        Component: ICON["motion-grey"],
        href: 'https://www.framer.com/api/motion/',
        className: 'size-10 grayscale',
        label: 'Motion',
    },
    {
        Component: ICON["mdx-grey"],
        href: 'https://mdxjs.com',
        className: 'size-10 grayscale',
        label: 'MDX',
    },
    {
        Component: ICON["github-grey"],
        href: 'https://github.com',
        className: 'size-10 grayscale',
        label: 'GitHub',
    },
    {
        Component: ICON["vercel-grey"],
        href: 'https://vercel.com',
        className: 'size-10 grayscale',
        label: 'Vercel',
    },
]
export const inspirationWebsites = [
    { name: 'manuarora.in', url: 'https://manuarora.in/' },
    { name: 'canvas.hrcd.fr', url: 'https://canvas.hrcd.fr/' },
    { name: 'marcbouchenoire.com', url: 'https://marcbouchenoire.com' },
    { name: 'magicui.design', url: 'https://magicui.design/' },
    { name: 'augen.pro', url: 'https://augen.pro/' },
    { name: 'ui.aceternity.com', url: 'https://ui.aceternity.com/' },
]
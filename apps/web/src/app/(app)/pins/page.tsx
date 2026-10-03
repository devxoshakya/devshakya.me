import { BreadcrumbJsonLd } from "@/seo/json-id";
import { createMetadata } from "@/seo/metadata";
import PinsSection from "@/components/pins/section";

export const metadata = createMetadata({
    title: "Pins",
    description:
        "A collection of visual notes, references, and things Dev Shakya wants to remember.",
    canonical: "/pins",
    category: "visual notes",
});

const PinsPage = () => (
    <section className="mb-2 mt-0">
        <BreadcrumbJsonLd
            items={[{ name: "Home", path: "/" }, { name: "Pins", path: "/pins" }]}
        />
        <PinsSection />
    </section>
);

export default PinsPage;

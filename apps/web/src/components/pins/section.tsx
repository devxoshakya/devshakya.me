import { Section } from "@devshakya.me/ui/components/section";
import { Title } from "@devshakya.me/ui/components/title";
import { CopyLink } from "@/components/copy-link";
import Pins from "./pins";

const PinsSection = () => {
    return (
        <Section id="pins">
            <span className="group/social flex items-center gap-1">
                <Title
                    className="text-xl font-medium italic"
                    render={<h2>{"pins."}</h2>}
                />
                <CopyLink
                    title={"pins"}
                    className="hidden group-hover/social:inline-flex"
                />
            </span>
            <Pins />
        </Section>
    );
};

export default PinsSection;

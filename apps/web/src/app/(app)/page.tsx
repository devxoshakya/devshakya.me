import { AboutSection } from "@/components/about/section";
import { ContactSection } from "@/components/contact/section";
import { Experiences } from "@/components/experience/exp";
import { ProjectSection } from "@/components/project/section";
import { WritingSection } from "@/components/blog/writing-section";
import { SoftwareSection } from "@/components/uses/software-section";
import { ROUTES } from "@/constants/routes";
import { FAQJsonLd, BreadcrumbJsonLd } from "@/seo/json-id";

const MainView = () => (
  <>
    <BreadcrumbJsonLd items={[{ name: "Home", path: ROUTES.HOME }]} />
    <FAQJsonLd />
    <AboutSection />
    <Experiences/>
    <ProjectSection />
    <WritingSection />
    <SoftwareSection/>
    <ContactSection />
  </>
);

export default MainView;

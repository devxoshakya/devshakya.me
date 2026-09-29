import { AboutSection } from "@/components/about/section";
import { ContactSection } from "@/components/contact/section";
import { CraftSection } from "@/components/craft/section";
import { Experiences } from "@/components/experience/exp";
import { ExperienceSection } from "@/components/experience/section";
import { ProjectSection } from "@/components/project/section";
import { SoftwareSection } from "@/components/uses/software-section";
import { ROUTES } from "@/constants/routes";
import { BreadcrumbJsonLd } from "@/seo/json-id";

const MainView = () => (
  <>
    <BreadcrumbJsonLd items={[{ name: "Home", path: ROUTES.HOME }]} />
    <AboutSection />
    {/* <CraftSection /> */}
    {/* <ExperienceSection /> */}
    <Experiences/>
    <ProjectSection />
    <SoftwareSection/>
    <ContactSection />
  </>
);

export default MainView;

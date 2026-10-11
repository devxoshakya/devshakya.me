import { EXPERIENCES } from "@/constants/experiences";
import { LINK } from "@/constants/links";
import { getBaseUrl } from "@/constants/url";

const [currentExperience] = EXPERIENCES;

export const USER = {
  address: {
    country: "India",
    locality: "Meerut",
  },
  avatar: "https://cdn2.devxoshakya.xyz/folio/avatar.png",
  company: currentExperience.experienceOrg.name,
  email: LINK.EMAIL,
  firstName: "Dev",
  jobTitle: currentExperience.experienceTitle,
  lastName: "Shakya",
  roles: ["Full Stack Developer", "Software Engineer", "AI Engineer"],
  username: "devxoshakya",
  website: getBaseUrl(),
};

export const NAME = `${USER.firstName} ${USER.lastName}`;

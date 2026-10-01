export const SITE_URL = "https://www.shivvyas.com";
export const PHOTO_SITE_URL = "https://awannabephotographer.shivvyas.com";
export const ASTRA_URL = "https://astra.shivvyas.com";

// Every profile that is unambiguously "this Shiv Vyas". Google uses this list
// to merge them into one entity (and one knowledge panel). Once the knowledge
// panel is claimed, add its Google Knowledge Graph URL here too, e.g.
// "https://www.google.com/search?kgmid=/g/XXXXXXXX".
const profiles = [
  "https://www.linkedin.com/in/shivvyas/",
  "https://www.youtube.com/@ShivVyas",
  "https://www.youtube.com/channel/UCLsQR29bzbW9xQkg4hX3Mfw",
  "https://www.instagram.com/shivvyas_/",
  "https://github.com/shivvyas2",
  PHOTO_SITE_URL,
];

export const person = {
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: "Shiv Vyas",
  givenName: "Shiv",
  familyName: "Vyas",
  alternateName: ["Shiv Amitkumar Vyas", "shivvyas", "shivvyas2"],
  url: `${SITE_URL}/`,
  image: `${SITE_URL}/images/about.jpeg`,
  jobTitle: "Founding Engineer",
  description:
    "Shiv Vyas is a software engineer in New York building web, mobile, and AI applications. He also makes music, runs a YouTube channel, and shoots photography as A Wannabe Photographer.",
  homeLocation: {
    "@type": "Place",
    name: "New York, NY",
  },
  knowsAbout: [
    "Software Engineering",
    "Web Development",
    "iOS Development",
    "Artificial Intelligence",
    "Photography",
    "Music Production",
  ],
  sameAs: profiles,
};

const personRef = { "@id": person["@id"] };

// Sites Shiv runs outside this domain, linked back to the same person entity.
export const ownedSites = [
  {
    "@type": "WebSite",
    "@id": `${PHOTO_SITE_URL}/#website`,
    name: "A Wannabe Photographer",
    alternateName: "awannabephotographer",
    url: `${PHOTO_SITE_URL}/`,
    description: "Photography by Shiv Vyas.",
    author: personRef,
    publisher: personRef,
  },
  {
    "@type": "WebApplication",
    "@id": `${ASTRA_URL}/#app`,
    name: "Astra",
    url: `${ASTRA_URL}/`,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web, iOS",
    description:
      "Astra computes a real birth chart and uses Claude to write a reading grounded in the exact positions.",
    creator: personRef,
  },
];

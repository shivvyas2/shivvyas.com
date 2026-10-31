export const SITE_URL = "https://www.shivvyas.com";
export const PHOTO_SITE_URL = "https://awannabephotographer.shivvyas.com";
export const ASTRA_URL = "https://astra.shivvyas.com";
export const STILLSHORE_URL = "https://stillshore.shivvyas.com";

// Every profile that is unambiguously "this Shiv Vyas". Google uses this list
// to merge them into one entity (and one knowledge panel). Once the knowledge
// panel is claimed, add its Google Knowledge Graph URL here too, e.g.
// "https://www.google.com/search?kgmid=/g/XXXXXXXX".
export const profiles = [
  "https://www.linkedin.com/in/shivvyas/",
  "https://www.youtube.com/@ShivVyas",
  "https://www.youtube.com/channel/UCLsQR29bzbW9xQkg4hX3Mfw",
  "https://www.instagram.com/shivvyas_/",
  "https://github.com/shivvyas2",
  // Music: the YouTube channel above carries the knowledge panel; these keep
  // it tied to this person and not to similarly named artists.
  "https://open.spotify.com/artist/0hA8muqKqdqGUfJ2dArUan",
  "https://music.apple.com/us/artist/shiv-vyas/1512819574",
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
  // Search-only: matches the LinkedIn profile so Google links the two. The
  // visible UI can keep its own wording.
  jobTitle: "AI Software Developer",
  worksFor: {
    "@type": "Organization",
    name: "Luna Social Inc",
    alternateName: "Contextual Intelligence for Marketing",
    url: "https://www.contextualintelligence.co",
  },
  description:
    "Shiv Vyas (shivvyas) is an AI software developer in New York who builds native apps for iPhone and Mac and AI products for the web, including Stillshore, Stash, PrepBoard, Astrya, MacBook Launchpad, Neuralyzer, SATistics and WhyKnot. Before software he made music, released on Spotify and Apple Music, and he is also a photographer who shoots as A Wannabe Photographer.",
  // Separates this Shiv Vyas from similarly named people in search.
  disambiguatingDescription:
    "New York AI software developer, photographer and former musician; creator of Stillshore, Stash, PrepBoard and Astrya.",
  alumniOf: [
    {
      "@type": "CollegeOrUniversity",
      name: "Pace University",
      url: "https://www.pace.edu",
    },
    {
      "@type": "CollegeOrUniversity",
      name: "Gujarat Technological University",
      url: "https://www.gtu.ac.in",
    },
  ],
  homeLocation: {
    "@type": "Place",
    name: "New York, NY",
  },
  hasOccupation: [
    { "@type": "Occupation", name: "AI Software Developer" },
    { "@type": "Occupation", name: "Software Developer" },
    { "@type": "Occupation", name: "Photographer" },
    { "@type": "Occupation", name: "Musician" },
  ],
  knowsAbout: [
    "Artificial Intelligence",
    "AI Applications",
    "Software Engineering",
    "iOS Development",
    "macOS Development",
    "Swift",
    "SwiftUI",
    "Web Development",
    "Next.js",
    "Photography",
    "Music Production",
  ],
  sameAs: profiles,
};

const personRef = { "@id": person["@id"] };

// "August 26, 2026" -> "2026-08-26"; undefined for "Ongoing" and the like.
export const isoDate = (value: string): string | undefined => {
  const date = new Date(value.replace(/(\d+)(st|nd|rd|th)/, "$1"));
  if (Number.isNaN(date.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
});

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
    alternateName: "Astrya",
    url: `${ASTRA_URL}/`,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web, iOS",
    description:
      "Astra (Astrya on the App Store) computes a real birth chart and uses Claude to write a reading grounded in the exact positions.",
    creator: personRef,
  },
  {
    "@type": "MobileApplication",
    "@id": `${STILLSHORE_URL}/#app`,
    name: "Stillshore",
    url: `${STILLSHORE_URL}/`,
    applicationCategory: "HealthApplication",
    operatingSystem: "iOS, iPadOS, watchOS",
    description:
      "Stillshore composes focus, rest and sleep sound live on the iPhone, over a looping film of a real place.",
    creator: personRef,
  },
];

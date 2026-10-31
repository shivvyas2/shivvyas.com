import AboutSection from "@/components/HomePage/AboutSection";
import AwardSection from "@/components/HomePage/AwardSection";
import BookCallSection from "@/components/HomePage/BookCallSection";
import HeroSection from "@/components/HomePage/HeroSection";
import ProjectSection from "@/components/HomePage/ProjectSection";
import ServiceSection from "@/components/HomePage/ServiceSection";
import Seo from "@/components/Seo";
import { SITE_URL, ownedSites, person } from "@/data/site";

export default function HomePage() {
  return (
    <>
      <Seo
        title="Shiv Vyas (shivvyas) | AI Software Developer, Photographer & Musician"
        description="Shiv Vyas (shivvyas) is an AI software developer in New York building apps for iPhone, Mac and the web: Stillshore, Stash, PrepBoard, Astrya and more. Also a photographer and former musician."
        path="/"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            person,
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: "Shiv Vyas",
              alternateName: ["shivvyas", "shivvyas.com"],
              url: `${SITE_URL}/`,
              inLanguage: "en-US",
              author: { "@id": person["@id"] },
              publisher: { "@id": person["@id"] },
            },
            ...ownedSites,
          ],
        }}
      />
      <HeroSection />
      <AboutSection />
      <ProjectSection />
      <ServiceSection />
      <AwardSection />

      <BookCallSection />
    </>
  );
}

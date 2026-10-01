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
        title="Shiv Vyas | Software Engineer & Creative Developer"
        description="Shiv Vyas (shivvyas) is a software engineer in New York building web, iOS, and AI applications. Explore his projects, music, and creative work."
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
              author: { "@id": person["@id"] },
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

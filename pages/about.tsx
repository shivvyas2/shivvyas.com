import AboutDetailsSection from "@/components/AboutPage/AboutDetailsSection";
import AboutHeroSection from "@/components/AboutPage/AboutHeroSection";
import BookCallSection from "@/components/HomePage/BookCallSection";
import Seo from "@/components/Seo";
import { SITE_URL, breadcrumbs, person } from "@/data/site";

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About Shiv Vyas | AI Software Developer, Photographer & Musician"
        description="Meet Shiv Vyas (shivvyas), a New York AI software developer who makes apps for iPhone, Mac and the web, shoots photography, and used to make music."
        path="/about"
        type="profile"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ProfilePage",
              "@id": `${SITE_URL}/about#profile`,
              url: `${SITE_URL}/about`,
              name: "About Shiv Vyas",
              inLanguage: "en-US",
              dateModified: "2026-09-30",
              mainEntity: person,
            },
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
            ]),
          ],
        }}
      />
      <AboutHeroSection />
      <AboutDetailsSection />

      <BookCallSection />
    </>
  );
}

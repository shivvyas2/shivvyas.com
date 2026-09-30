import AboutDetailsSection from "@/components/AboutPage/AboutDetailsSection";
import AboutHeroSection from "@/components/AboutPage/AboutHeroSection";
import BookCallSection from "@/components/HomePage/BookCallSection";
import Seo from "@/components/Seo";
import { SITE_URL, person } from "@/data/site";

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About Shiv Vyas | Engineer, Music Maker & Photographer"
        description="Meet Shiv Vyas, a New York software engineer and creative developer. Explore his experience in web and mobile development, music, and photography."
        path="/about"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "@id": `${SITE_URL}/about#profile`,
          url: `${SITE_URL}/about`,
          name: "About Shiv Vyas",
          mainEntity: person,
        }}
      />
      <AboutHeroSection />
      <AboutDetailsSection />

      <BookCallSection />
    </>
  );
}

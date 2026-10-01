import ContactSection from "@/components/ContactPage";
import BookCallSection from "@/components/HomePage/BookCallSection";
import Seo from "@/components/Seo";
import { SITE_URL, person } from "@/data/site";

export default function ContactPage() {
  return (
    <>
      <Seo
        title="Contact Shiv Vyas | Projects & Collaborations"
        description="Get in touch with Shiv Vyas about software engineering, web and mobile projects, or creative collaborations. Based in New York."
        path="/contact"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "@id": `${SITE_URL}/contact#page`,
          url: `${SITE_URL}/contact`,
          name: "Contact Shiv Vyas",
          mainEntity: { "@id": person["@id"] },
        }}
      />
      <ContactSection />
      <BookCallSection />
    </>
  );
}

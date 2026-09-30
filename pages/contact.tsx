import ContactSection from "@/components/ContactPage";
import BookCallSection from "@/components/HomePage/BookCallSection";
import Seo from "@/components/Seo";

export default function ContactPage() {
  return (
    <>
      <Seo
        title="Contact Shiv Vyas | Projects & Collaborations"
        description="Get in touch with Shiv Vyas about software engineering, web and mobile projects, or creative collaborations. Based in New York."
        path="/contact"
      />
      <ContactSection />
      <BookCallSection />
    </>
  );
}

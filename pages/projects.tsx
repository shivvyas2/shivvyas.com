import BookCallSection from "@/components/HomePage/BookCallSection";
import ProjectHeroSection from "@/components/ProjectPage/ProjectHeroSection";
import ProjectsSection from "@/components/ProjectPage/ProjectsSection";
import Seo from "@/components/Seo";

export default function ProjectPage() {
  return (
    <>
      <Seo
        title="Projects by Shiv Vyas | Web, iOS & AI Applications"
        description="Explore software projects by Shiv Vyas, including Life OS, Astra, ELXR Creative, and more. Case studies in web development, iOS apps, and AI."
        path="/projects"
      />
      <ProjectHeroSection />
      <ProjectsSection />
      <BookCallSection />
    </>
  );
}

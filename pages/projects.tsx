import BookCallSection from "@/components/HomePage/BookCallSection";
import ProjectHeroSection from "@/components/ProjectPage/ProjectHeroSection";
import ProjectsSection from "@/components/ProjectPage/ProjectsSection";
import Seo from "@/components/Seo";
import { projects } from "@/data/projectsData";
import { SITE_URL, breadcrumbs, person } from "@/data/site";

export default function ProjectPage() {
  return (
    <>
      <Seo
        title="Apps by Shiv Vyas | iPhone, Mac & AI Projects"
        description="Apps and AI products by Shiv Vyas: Stillshore, Stash (Windows games on Mac), PrepBoard, Astrya, MacBook Launchpad, Neuralyzer, SATistics, WhyKnot and more."
        path="/projects"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": `${SITE_URL}/projects#page`,
              url: `${SITE_URL}/projects`,
              name: "Projects by Shiv Vyas",
              author: { "@id": person["@id"] },
              mainEntity: {
                "@type": "ItemList",
                itemListElement: projects.map((project, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: project.title,
                  url: `${SITE_URL}/projects/${project.slug}`,
                })),
              },
            },
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Projects", path: "/projects" },
            ]),
          ],
        }}
      />
      <ProjectHeroSection />
      <ProjectsSection />
      <BookCallSection />
    </>
  );
}

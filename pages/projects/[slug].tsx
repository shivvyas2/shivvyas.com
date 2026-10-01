import { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/image";
import { projects, Project } from "@/data/projectsData";
import styles from "./ProjectPage.module.scss";
import Button from "@/components/Button";
import BookCallSection from "@/components/HomePage/BookCallSection";
import MacbookMockup from "@/components/MacbookMockup";
import Seo from "@/components/Seo";
import { SITE_URL, breadcrumbs, person } from "@/data/site";
import { gsap } from "@/libs/gsap";
import { useEffect, useRef } from "react";

// Fetch the list of possible slugs for static generation
export const getStaticPaths: GetStaticPaths = async () => {
  const paths = projects.map((project) => ({
    params: { slug: project.slug },
  }));

  return {
    paths,
    fallback: false, // Use 'blocking' if you want to handle undefined slugs dynamically
  };
};

// Fetch the project data based on the slug
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params!;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return { notFound: true }; // Return 404 if project not found
  }

  return {
    props: { project },
  };
};

type ProjectPageProps = {
  project: Project;
};

const ProjectPage = ({ project }: ProjectPageProps) => {
  const imageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      window.matchMedia("(max-width: 840px), (prefers-reduced-motion: reduce)")
        .matches
    )
      return;
    const tween = gsap.from(imageRef.current, {
      duration: 1.5,
      ease: "power3.out",
      scale: "1.4",
    });
    return () => {
      tween.revert();
    };
  }, []);

  return (
    <>
      <Seo
        title={`${project.title} | A Project by Shiv Vyas`}
        description={`${project.title} by Shiv Vyas. ${project.overview.slice(0, 140).replace(/\s+\S*$/, "")}…`}
        path={`/projects/${project.slug}`}
        image={project.img}
        imageAlt={`${project.title} — a project by Shiv Vyas`}
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CreativeWork",
              name: project.title,
              description: project.overview,
              url: `${SITE_URL}/projects/${project.slug}`,
              image: `${SITE_URL}${project.img}`,
              keywords: project.category.join(", "),
              ...(project.live && project.live !== "#"
                ? { sameAs: project.live }
                : {}),
              creator: {
                "@type": "Person",
                "@id": person["@id"],
                name: person.name,
                url: person.url,
              },
            },
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Projects", path: "/projects" },
              { name: project.title, path: `/projects/${project.slug}` },
            ]),
          ],
        }}
      />
      {/*========= Header ==========*/}
      <header
        className={`${styles.ProjectSinglePage} ${project.textColor === "black" ? styles.blackText : ""}`}
      >
        <div ref={imageRef} className={styles.imageWrapper}>
          <Image
            src={project.img}
            alt={project.title}
            width={800}
            height={500}
            priority
            sizes="100vw"
          />
        </div>

        {/* Project Details */}
        <div className={styles.projectDetails}>
          <div className={styles.titleRow}>
            {project.logo && (
              <Image
                className={styles.logo}
                src={project.logo}
                alt={`${project.title} logo`}
                width={96}
                height={96}
                sizes="96px"
              />
            )}
            <h1>{project.title}</h1>
          </div>
          <div className={styles.category}>
            {project.category.map((cat, idx) => (
              <h5 key={idx}>{cat}</h5>
            ))}
          </div>
        </div>
      </header>

      {/*========= Video Showcase ==========*/}
      {project.video && (
        <section className={styles.showcase}>
          <MacbookMockup
            src={project.video.src}
            poster={project.video.poster}
            title={`${project.title} walkthrough`}
          />
        </section>
      )}

      {/*========= Content ==========*/}
      <section className={styles.projectContent}>
        {/* Sticky project details */}
        <div className={styles.sticky}>
          <div className={styles.wrapper}>
            <h2>Project Details</h2>
            <div>
              <h3>Owner</h3>
              <h4>{project.owner}</h4>
            </div>
            <div>
              <h3>Release Date</h3>
              <h4>{project.date}</h4>
            </div>
            <div>
              <h3>Services</h3>
              <h4>{project.services}</h4>
            </div>
            <div>
              <h3>Duration</h3>
              <h4>{project.duration}</h4>
            </div>
            <div>
              <h3>Budget</h3>
              <h4>{project.budget ?? "—"}</h4>
            </div>
          </div>
          <Button
            text="Launch Project"
            targetBlank={true}
            href={project.live}
          />
        </div>

        {/* Scroll project Content */}
        <div className={styles.scroll}>
          <div>
            <h2>Overview</h2>
            <p>{project.overview}</p>
          </div>
          <div>
            <h2>Objective</h2>
            <p>{project.objective}</p>
          </div>
          <div>
            <h2>Process</h2>
            <p>{project.process}</p>
          </div>
          <div>
            <h2>Impact</h2>
            <p>{project.impact}</p>
          </div>
        </div>
      </section>

      {/*========= Gallery ==========*/}
      {project.gallery && project.gallery.length > 0 && (
        <section className={styles.gallery}>
          {project.gallery.map((src, idx) => (
            <div key={src} className={styles.galleryItem}>
              <Image
                src={src}
                alt={`${project.title} screen ${idx + 1}`}
                width={1800}
                height={1200}
                sizes="(max-width: 600px) 100vw, 50vw"
              />
            </div>
          ))}
        </section>
      )}

      {/*========= Book Call Section ==========*/}
      <BookCallSection />
    </>
  );
};

export default ProjectPage;

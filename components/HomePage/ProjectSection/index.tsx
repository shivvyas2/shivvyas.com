import { useEffect, useRef } from "react";
import { gsap } from "@/libs/gsap";
import { splitText } from "@/utils/textUtils";
import styles from "./ProjectSection.module.scss";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/Button";
import Tag from "@/components/Tag";
import { projects } from "@/data/projectsData";

export default function ProjectSection() {
  const cardRefs = useRef<HTMLAnchorElement[]>([]);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLDivElement | null>(null);
  const btnWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 841px) and (prefers-reduced-motion: no-preference)",
      () => {
        // Create a timeline for the heading wrapper animations
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: `.${styles.projects} .${styles.heading}`,
            start: "top 70%",
            onEnter: () => tl.play(),
          },
        });

        // Animation sequence
        if (taglineRef.current) {
          tl.from(taglineRef.current, { y: 50, opacity: 0, duration: 0.8 }, 0);
        }

        if (headingRef.current) {
          const headingSpans = headingRef.current.querySelectorAll("span span");
          tl.from(
            headingSpans,
            { y: "110%", duration: 0.6, stagger: 0.04 },
            0.4,
          );
        }

        if (btnWrapperRef.current) {
          tl.from(
            btnWrapperRef.current,
            { y: 50, opacity: 0, duration: 0.8 },
            0.8,
          );
        }
      },
    );
    // The stacked-card animation runs on every screen size (phones included);
    // only reduced motion opts out.
    media.add("(prefers-reduced-motion: no-preference)", () => {
      cardRefs.current.forEach((card, i) => {
        if (i < cardRefs.current.length - 1) {
          gsap.to(card, {
            scale: 0.8,
            opacity: 0,
            scrollTrigger: {
              trigger: cardRefs.current[i + 1],
              start: "top center",
              end: "top top",
              scrub: true,
            },
          });
        }
      });
    });
    return () => media.revert();
  }, []);

  const addToRefs = (el: HTMLAnchorElement | null) => {
    if (el && !cardRefs.current.includes(el)) {
      cardRefs.current.push(el);
    }
  };

  return (
    <section
      id="selected-work"
      className={styles.projects}
      aria-labelledby="projects-heading"
    >
      {/* heading */}
      <div className={styles.heading}>
        <div ref={taglineRef}>
          <Tag text="Creations" />
        </div>
        <div className={styles.headingWrapper}>
          <h2 id="projects-heading" ref={headingRef}>
            {splitText("A look into my latest projects")}
          </h2>
          <div ref={btnWrapperRef}>
            <Button text="All Projects" href="/projects" />
          </div>
        </div>
      </div>

      {/* projects wrapper */}
      <div className={styles.wrapper}>
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            ref={addToRefs}
            className={`${styles.projectCard} ${project.textColor === "black" ? styles.blackText : ""}`}
          >
            <Image
              src={project.img}
              width={1200}
              height={750}
              sizes="(max-width: 840px) 100vw, 65vw"
              alt={`${project.title} project preview`}
            />
            <div className={styles.projectDetails}>
              <div className={styles.title}>
                <h3>{project.title}</h3>
              </div>
              <div className={styles.category}>
                {project.category.map((cat, j) => (
                  <span key={j}>{cat}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

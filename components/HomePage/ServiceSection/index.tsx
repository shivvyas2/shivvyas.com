import { useEffect, useRef } from "react";
import ServiceCard from "./card";
import styles from "./ServiceSection.module.scss";
import { gsap } from "@/libs/gsap";
import Tag from "@/components/Tag";
import Button from "@/components/Button";
import { splitText } from "@/utils/textUtils";

// Define the Service interface
interface Service {
  title: string;
  numbering: string;
  listItems: string[];
}

// Define the services data
const services: Service[] = [
  {
    title: "Mobile Application Development",
    numbering: "01",
    listItems: ["Discovery", "Research", "iOS", "Android", "React Native"],
  },
  {
    title: "Design",
    numbering: "02",
    listItems: [
      "Branding",
      "UI/UX",
      "Visual Identity",
      "Graphics",
      "Illustration",
    ],
  },
  {
    title: "Development",
    numbering: "03",
    listItems: [
      "Frontend",
      "React",
      "API Integration",
      "Testing",
      "Deployment",
      "Full Stack",
    ],
  },
  {
    title: "Others",
    numbering: "04",
    listItems: [
      "3D Websites",
      "Visualization",
      "Music Production",
      "Animations",
    ],
  },
];

// Define the ServiceSection component
export default function ServiceSection() {
  const container = useRef<HTMLElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLDivElement | null>(null);
  const btnWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 841px) and (prefers-reduced-motion: no-preference)",
      () => {
        const ctx = gsap.context(() => {
          // Heading animation timeline
          const headingTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: `.${styles.services} .${styles.heading}`,
              start: "top 70%",
            },
          });

          // Tagline animation
          if (taglineRef.current) {
            headingTimeline.from(
              taglineRef.current,
              { y: 50, opacity: 0, duration: 0.8 },
              0,
            );
          }

          // Heading text animation
          if (headingRef.current) {
            const headingSpans =
              headingRef.current.querySelectorAll("span span");
            headingTimeline.from(
              headingSpans,
              { y: "110%", duration: 0.6, stagger: 0.04 },
              0.4,
            );
          }

          // Button wrapper animation
          if (btnWrapperRef.current) {
            headingTimeline.from(
              btnWrapperRef.current,
              { y: 50, opacity: 0, duration: 0.8 },
              0.8,
            );
          }

          // Cards: one pinned, scrubbed timeline. Timeline units map to the
          // pin length (3 units = 3 viewport heights): spread during 0→1,
          // then each card flips and straightens, staggered.
          const positions = [13, 37.7, 62.4, 87];
          const rotations = [-15, -7.5, 7.5, 15];
          const cards = cardRefs.current.filter(Boolean);
          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: container.current,
              start: "top top",
              end: () => `+=${window.innerHeight * 3}`,
              pin: true,
              pinSpacing: true,
              anticipatePin: 1,
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
          cards.forEach((card, index) => {
            timeline.to(
              card,
              { left: `${positions[index]}%`, top: "50%", yPercent: -50, rotation: rotations[index], duration: 1 },
              0,
            );
          });
          cards.forEach((card, index) => {
            const start = 1 + index * 0.15;
            const front = card.querySelector(".flipCardFrontA");
            const back = card.querySelector(".flipCardBackB");
            if (front && back) {
              timeline
                .fromTo(front, { rotateY: 0 }, { rotateY: -180, duration: 1 }, start)
                .fromTo(back, { rotateY: 180 }, { rotateY: 0, duration: 1 }, start);
            }
            timeline.to(card, { rotation: 0, duration: 1 }, start);
          });
          timeline.set({}, {}, 3);
        });

        // Cleanup on unmount: only this section's tweens and triggers
        return () => ctx.revert();
      },
    );
    return () => media.revert();
  }, []);

  return (
    <section className={styles.services}>
      {/* heading */}
      <div className={styles.heading}>
        <div ref={taglineRef}>
          <Tag text="capabilities" />
        </div>
        <div className={styles.headingWrapper}>
          <h2 ref={headingRef}>
            {splitText("Tailored Solutions for Your Unique Vision")}
          </h2>
          <div ref={btnWrapperRef}>
            <Button text="Get in touch" href="/contact" />
          </div>
        </div>
      </div>

      {/* Services cards */}
      <section className={styles.wrapper} ref={container}>
        {services.map((service, index) => (
          <ServiceCard
            key={index}
            ref={(el) => {
              if (el) cardRefs.current[index] = el; // Ensure ref is set correctly
            }}
            title={service.title}
            numbering={service.numbering}
            listItems={service.listItems}
          />
        ))}
      </section>

      {/* Services cards for small devices */}
      <div className={styles.mobileWrapper}>
        {services.map((service) => (
          <div className={styles.card} key={service.numbering}>
            <h3 className={styles.title}>{service.title}</h3>
            <ul>
              {service.listItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <h2 className={styles.numbering}>{service.numbering}</h2>
          </div>
        ))}
      </div>
    </section>
  );
}

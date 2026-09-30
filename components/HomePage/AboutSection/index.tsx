import { useEffect, useRef } from "react";
import { gsap } from "@/libs/gsap";
import styles from "./AboutSection.module.scss";

const aboutText = "I am a Software Developer with 3 years of experience, specializing in creating apps that merge functionality with intuitive design. My expertise lies at the intersection of mobile development, web development, and backend systems, enabling me to craft seamless and innovative digital solutions. With a broad skill set, I approach challenges from diverse perspectives to deliver impactful and user-centric experiences.";

export default function AboutSection() {
  const aboutTextRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(min-width: 841px) and (prefers-reduced-motion: no-preference)", () => {
      const heading = aboutTextRef.current;
      if (!heading) return;
      gsap.fromTo(heading.querySelectorAll(".letter"), { opacity: 0.2 }, {
        opacity: 1,
        duration: 0.4,
        stagger: 0.02,
        ease: "power2.out",
        scrollTrigger: {
          trigger: heading,
          start: "top 90%",
          end: "bottom 60%",
          scrub: 1,
        },
      });
    });
    return () => media.revert();
  }, []);

  return (
    <section id="about" className={styles.about} aria-labelledby="about-heading">
      <div className={styles.container}>
        <h2 id="about-heading" className={styles.aboutText} ref={aboutTextRef}>
          <span className="sr-only">{aboutText}</span>
          <span aria-hidden="true">
            {aboutText.split(" ").map((word, wordIndex) => (
              <span key={wordIndex}>
                <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                  {word.split("").map((letter, letterIndex) => (
                    <span className="letter" key={letterIndex} style={{ display: "inline-block" }}>{letter}</span>
                  ))}
                </span>{" "}
              </span>
            ))}
          </span>
        </h2>
        <div className={styles.btnSpace} aria-hidden="true" />
      </div>
    </section>
  );
}

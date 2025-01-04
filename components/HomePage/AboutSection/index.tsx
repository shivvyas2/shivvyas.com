import { useEffect, useRef } from "react";
import { gsap } from "@/libs/gsap";
import styles from "./AboutSection.module.scss";

export default function AboutSection() {
    const aboutTextRef = useRef<HTMLHeadingElement | null>(null);
    const taglineRef = useRef<HTMLDivElement | null>(null);
    const btnWrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const aboutText = aboutTextRef.current;
        const tagline = taglineRef.current;
        const buttonWrapper = btnWrapperRef.current;

        // Animate the aboutText (already implemented)
        if (aboutText) {
            const text = aboutText.textContent?.trim() || "";
            const hasProcessed = aboutText.querySelector(".letter");

            if (!hasProcessed) {
                aboutText.innerHTML = text
                    .split(" ")
                    .map(word =>
                        `<span class="word" style="will-change: opacity; display: inline-block;">${word.split("").map(letter => `<span class="letter" style="will-change: opacity; display: inline-block;">${letter}</span>`).join("")}</span>`
                    )
                    .join(" ") + " ";

                const letters = aboutText.querySelectorAll(".letter");
                gsap.set(letters, { opacity: 0.2 });

                gsap.timeline({
                    scrollTrigger: {
                        trigger: aboutText,
                        start: "top 90%",
                        end: "bottom 60%",
                        scrub: 1,
                    },
                }).to(letters, {
                    opacity: 1,
                    duration: 0.4,
                    stagger: 0.02,
                    ease: "power2.out",
                });
            }
        }

        // Animate tagline and button using a helper function
        const animateElement = (element: HTMLElement | null, trigger: HTMLElement | null, start: string, end: string, fromProps: gsap.TweenVars) => {
            if (element) {
                gsap.timeline({
                    scrollTrigger: {
                        trigger,
                        start,
                        end,
                        once: true,
                    },
                }).from(element, fromProps);
            }
        };

        animateElement(tagline, tagline, "top 90%", "top 50%", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" });
        animateElement(buttonWrapper, tagline, "top 50%", "top 30%", { y: 50, opacity: 0, duration: 1, ease: "power2.out" });

    }, []);

    return (
        <section className={styles.about}>
            <div className={styles.container}>
                <div ref={taglineRef}>
                  
                </div>
                <h2 className={styles.aboutText} ref={aboutTextRef}>
                I am a <span>Software Developer</span> with 3 years of experience, specializing in creating <span>apps</span> that merge functionality with intuitive design. My expertise lies at the intersection of <span>mobile development</span>, <span>web development</span>, and <span>backend systems</span>, enabling me to craft seamless and innovative digital solutions. With a broad skill set, I approach challenges from diverse perspectives to deliver impactful and user-centric experiences.
                </h2>
                <div className={styles.btnSpace} ref={btnWrapperRef}>
                   
                </div>
            </div>
        </section>
    );
}


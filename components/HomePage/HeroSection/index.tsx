import { useEffect, useRef, useState } from "react";
import { gsap } from "@/libs/gsap";
import styles from "./HeroSection.module.scss";
import ComputersCanvas from "@/components/canvas/Computer";
import { motion } from "framer-motion";

export default function HeroSection() {
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const marqueeTextRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const scrollToNext = () => {
    const nextSection = document.getElementById("about");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 500);
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  useEffect(() => {
    const marqueeElement = marqueeRef.current;
    const marqueeTextElement = marqueeTextRef.current;

    if (marqueeElement && marqueeTextElement) {
      marqueeTextElement.innerHTML += marqueeTextElement.innerHTML;

      gsap.to(marqueeTextElement, {
        xPercent: -100,
        ease: "none",
        duration: 450,
        repeat: -1,
        modifiers: {
          xPercent: gsap.utils.wrap(-100, 0),
        },
      });
    }
  }, [isMobile]);

  return (
    <section className={`${styles.hero} relative w-full h-screen mx-auto`}>
      {/* Text on Top-Right */}
      <div className={styles["text-container"]}>
        <h1>
          Hi, I'm <span>Shiv</span>
        </h1>
        <p>
          I am a <span>Software Developer</span> based in New York, currently interning at a fintech company. <br />
        </p>
      </div>

      {/* 3D Computer Background */}
      <div className={styles.background}>
        <ComputersCanvas />
      </div>

      {/* Marquee */}
      {!isMobile && (
        <div className={styles.marquee} ref={marqueeRef}>
          <div className={styles.content} ref={marqueeTextRef}>
            &nbsp;Shiv Vyas - Shiv Vyas - Shiv Vyas - Shiv Vyas - Shiv Vyas -
            Shiv Vyas - Shiv Vyas - Shiv Vyas - Shiv Vyas - Shiv Vyas - Shiv Vyas
            - Shiv Vyas - Shiv Vyas - Shiv Vyas - Shiv Vyas -
          </div>
        </div>
      )}
      {isMobile && (
        <div className={`${styles.marquee} ${styles.mobileMarquee}`}>
          <div className={styles.content}>
            Shiv Vyas - Software Developer
          </div>
        </div>
      )}

      {/* Scroll to Next Section Button */}
      <div className='absolute xs:bottom-10 bottom-12 w-full flex justify-center items-center'>
      <a href='#about'>
        <div className='w-[35px] h-[64px] rounded-3xl border-4 border-[#5CB8E4] flex justify-center items-start p-2'>
          <motion.div
            animate={{
              y: [0, 24, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop",
            }}
            className='w-3 h-3 rounded-full bg-[#5CB8E4] mb-1'
          />
        </div>
      </a>
    </div>
    </section>
  );
}


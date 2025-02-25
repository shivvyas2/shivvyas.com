import { useEffect, useRef, useState } from "react";
import { gsap } from "@/libs/gsap";
import styles from "./HeroSection.module.scss";
import ComputersCanvas from "@/components/canvas/Computer";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function HeroSection() {
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const marqueeTextRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const handleScroll = () => {
    document.getElementById('about')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
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
          I am a <span>Software Developer</span> based in New York, currently interning at <span>FuteurAI</span>. <br />
        </p>
      </div>
      {/* 3D Computer Background */}
      <div className={styles.background}>
        <ComputersCanvas />
      </div>

      {/* Scroll Down Button */}
      <div 
        className="absolute left-1/2 bottom-10 -translate-x-1/2 z-[9999] cursor-pointer pointer-events-auto group"
        onClick={handleScroll}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="bg-[#5CB8E4]/10 backdrop-blur-sm p-3 rounded-full group-hover:bg-[#5CB8E4]/20 transition-all group-hover:scale-110 border border-[#5CB8E4]/20"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop",
            }}
          >
            <ChevronDown className="w-6 h-6 text-[#5CB8E4]" strokeWidth={2.5} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}


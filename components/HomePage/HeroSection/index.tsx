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

  const handleScroll = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event propagation
    
    // Force a small timeout to ensure DOM is ready
    setTimeout(() => {
      // Option 1: Try to find the about section by ID
      const aboutSection = document.getElementById('about');
      
      if (aboutSection) {
        // Use window.scrollTo for better cross-browser support
        const offsetTop = aboutSection.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      } else {
        // Option 2: Find the next section after hero
        const heroSection = document.querySelector(`.${styles.hero}`);
        if (heroSection && heroSection.nextElementSibling) {
          const offsetTop = heroSection.nextElementSibling.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    }, 50);
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
        I'm a <span>Software Developer</span> from New York, currently building at <span>FuteurAI</span>. <br />
        </p>
       
      </div>
      {/* 3D Computer Background */}
      <div className={styles.background}>
        <ComputersCanvas />
      </div>

      {/* Scroll Down Button */}
      <div 
        className="absolute left-1/2 bottom-10 -translate-x-1/2 z-[99999] cursor-pointer pointer-events-auto group"
        style={{ touchAction: 'manipulation', position: 'relative' }}
        onClick={handleScroll}
        onTouchEnd={handleScroll}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="bg-[#f44e00]/40 backdrop-blur-sm p-4 rounded-full group-hover:bg-[#f44e00]/60 transition-all group-hover:scale-110 border-2 border-[#f44e00] shadow-lg shadow-[#f44e00]/30"
          style={{ zIndex: 99999 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop",
            }}
          >
            <ChevronDown className="w-8 h-8 text-white" strokeWidth={3} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}


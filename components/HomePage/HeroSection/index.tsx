import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import styles from "./HeroSection.module.scss";

const ComputersCanvas = dynamic(() => import("@/components/canvas/Computer"), {
  ssr: false,
});

export default function HeroSection() {
  const [showScene, setShowScene] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setShowScene(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles["text-container"]}>
        <h1 id="hero-title" aria-label="Hi, I'm Shiv Vyas">
          Hi, I&apos;m <span>Shiv</span>
        </h1>
        <p>
          I&apos;m a <span>Founding Engineer</span> from New York, currently
          building at <span>Contextual Intelligence</span>.
        </p>
      </div>
      <div className={styles.background} aria-hidden="true">
        {showScene && <ComputersCanvas />}
      </div>
      <button
        type="button"
        aria-label="Scroll to about section"
        className={styles.scrollDown}
        onClick={() => {
          document.getElementById("about")?.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
          });
        }}
      >
        <motion.span
          className={styles.scrollDownRing}
          initial={reducedMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.span
            className={styles.scrollDownIcon}
            animate={reducedMotion ? { y: 0 } : { y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: reducedMotion ? 0 : Infinity }}
          >
            <ChevronDown strokeWidth={2.5} aria-hidden="true" />
          </motion.span>
        </motion.span>
      </button>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import styles from "./HeroSection.module.scss";
import { useSceneLoading } from "@/components/Loader/LoadingContext";
import SceneBoundary from "@/components/Loader/SceneBoundary";

const ComputersCanvas = dynamic(() => import("@/components/canvas/Computer"), {
  ssr: false,
});

export default function HeroSection() {
  const [showScene, setShowScene] = useState(false);
  const [deskView, setDeskView] = useState(false);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [interactionNote, setInteractionNote] = useState("");
  const interactionTimeout = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();
  const { finishScene, updateSceneProgress } = useSceneLoading();

  const announceInteraction = useCallback((message: string) => {
    setInteractionNote(message);
    if (interactionTimeout.current)
      window.clearTimeout(interactionTimeout.current);
    interactionTimeout.current = window.setTimeout(
      () => setInteractionNote(""),
      1800,
    );
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setShowScene(!query.matches);
      if (query.matches) finishScene();
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [finishScene]);

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
      <div
        className={`${styles.background} ${deskView ? styles.deskView : ""}`}
        aria-label="Interactive 3D studio desk"
      >
        {showScene && (
          <SceneBoundary onError={finishScene}>
            <ComputersCanvas
              onReady={finishScene}
              onProgress={updateSceneProgress}
              onDeskViewChange={setDeskView}
              onOpenDiary={() => setDiaryOpen(true)}
              onInteraction={announceInteraction}
            />
          </SceneBoundary>
        )}
      </div>
      <div className={styles.deskHelp} aria-live="polite">
        {interactionNote ||
          (deskView
            ? "Tap the keyboard, drag the mouse or boom arm, and open the diary."
            : "Click the desk to explore")}
      </div>
      {deskView && (
        <button
          type="button"
          className={styles.deskClose}
          onClick={() => setDeskView(false)}
        >
          Return to hero
        </button>
      )}
      {diaryOpen && (
        <div
          className={styles.diaryBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDiaryOpen(false);
          }}
        >
          <article
            className={styles.diary}
            role="dialog"
            aria-modal="true"
            aria-labelledby="diary-title"
          >
            <button
              type="button"
              className={styles.diaryClose}
              aria-label="Close Shiv's diary"
              onClick={() => setDiaryOpen(false)}
            >
              ×
            </button>
            <div className={styles.diaryPaperclip} aria-hidden="true" />
            <p className={styles.diaryKicker}>field notes / 01</p>
            <h2 id="diary-title">Shiv&apos;s desk diary</h2>
            <p className={styles.diaryIntro}>
              Engineer, musician, photographer. I like the moment a rough idea
              starts feeling useful.
            </p>
            <div className={styles.diaryGrid}>
              <div>
                <p>
                  <strong>Now</strong> — Founding Engineer at Contextual
                  Intelligence
                </p>
                <p>
                  <strong>Before</strong> — FuteurAI, wrapped May 12
                </p>
                <p>
                  <strong>Always</strong> — make, listen, notice, repeat
                </p>
              </div>
              <svg
                className={styles.diarySketch}
                viewBox="0 0 180 110"
                role="img"
                aria-label="Hand drawn sketch of an idea becoming a product"
              >
                <path d="M12 74 C42 24 63 91 91 45 S137 20 169 32" />
                <path d="M146 22 l23 10 -19 13" />
                <circle cx="42" cy="55" r="13" />
                <rect x="78" y="56" width="28" height="22" rx="3" />
                <path d="M55 55 h23 M106 67 h36" />
                <text x="24" y="100">
                  signal → tool
                </text>
              </svg>
            </div>
            <div className={styles.diaryProjects}>
              <span>camera studies</span>
              <span>small useful tools</span>
              <span>music between builds</span>
            </div>
            <p className={styles.diarySignoff}>— Shiv</p>
          </article>
        </div>
      )}
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

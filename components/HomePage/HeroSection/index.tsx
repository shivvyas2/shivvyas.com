import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { useLenis } from "@studio-freight/react-lenis";
import styles from "./HeroSection.module.scss";
import { useSceneLoading } from "@/components/Loader/LoadingContext";
import SceneBoundary from "@/components/Loader/SceneBoundary";
import { dispatchDesk, useDesk } from "@/components/canvas/desk/useDesk";
import { MODEL_URL } from "@/components/canvas/desk/modelUrl";
import { PHOTO_URL } from "@/components/canvas/desk/lib/cameraContent.mjs";
import { spreadText, PAGES } from "@/components/canvas/desk/lib/diaryPages.mjs";

const DeskCanvas = dynamic(() => import("@/components/canvas/desk/DeskCanvas"), { ssr: false });

const ANNOUNCE: Record<string, string> = {
  hero: "",
  desk: "Desk view. Type on your keyboard, drag the mouse or the microphone, open the diary, or pick up the camera.",
  camera: "Shiv's camera. The screen reads: loves photography. Open Photos goes to the photography site.",
};

export default function HeroSection() {
  const [showScene, setShowScene] = useState(false);
  const [active, setActive] = useState(true);
  const [explored, setExplored] = useState(false);
  const [warm, setWarm] = useState(false);
  const onWarm = useCallback(() => setWarm(true), []);
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const lenis = useLenis();
  const { finishScene, updateSceneProgress } = useSceneLoading();
  const mode = useDesk((s: { mode: string }) => s.mode);
  const spread = useDesk((s: { spread: number }) => s.spread);
  const inDesk = mode !== "hero";

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setShowScene(!query.matches);
      if (query.matches) finishScene();
      // Start the model download before the three.js chunk arrives.
      if (!query.matches && !document.querySelector(`link[href="${MODEL_URL}"]`)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "fetch";
        link.href = MODEL_URL;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [finishScene]);

  useEffect(() => () => dispatchDesk({ type: "reset" }), []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inDesk) return;
    setExplored(true);
    const root = document.documentElement;
    const previous = root.style.overflow;
    lenis?.scrollTo(0, { duration: 0.6, onComplete: () => lenis?.stop() });
    if (!lenis) window.scrollTo({ top: 0 });
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatchDesk({ type: "escape" });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = previous;
      lenis?.start();
    };
  }, [inDesk, lenis]);

  return (
    <section
      ref={sectionRef}
      className={`${styles.hero} ${inDesk ? styles.inDesk : ""}`}
      aria-labelledby="hero-title"
    >
      <div className={styles["text-container"]}>
        <h1 id="hero-title" aria-label="Hi, I'm Shiv Vyas">
          Hi, I&apos;m <span>Shiv</span>
          <span className="sr-only"> Vyas</span>
        </h1>
        <p>
          I&apos;m a <span>Founding Engineer</span> from New York, currently
          building at <span>Contextual Intelligence</span>.
        </p>
      </div>
      <div className={`${styles.background} ${warm ? styles.warm : ""}`}>
        {showScene && (
          <SceneBoundary onError={finishScene}>
            <DeskCanvas onReady={finishScene} onProgress={updateSceneProgress} onWarm={onWarm} active={active} />
          </SceneBoundary>
        )}
      </div>
      <div className={styles.vignette} aria-hidden="true" />
      {showScene && warm && !inDesk && (
        <button type="button" className={styles.srFocusable} onClick={() => dispatchDesk({ type: "enterDesk" })}>
          Explore Shiv&apos;s desk
        </button>
      )}
      {showScene && !inDesk && !explored && (
        <p className={styles.deskHint} aria-hidden="true">click the desk</p>
      )}
      {inDesk && (
        <button
          type="button"
          className={styles.deskExit}
          aria-label={mode === "diary" ? "Close the diary" : mode === "camera" ? "Put the camera down" : "Leave the desk"}
          onClick={() => dispatchDesk({ type: "escape" })}
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
      <p className={styles.srOnly} aria-live="polite">
        {mode === "diary"
          ? `Diary, pages ${spread * 2 + 1} and ${spread * 2 + 2} of ${PAGES.length}. ${spreadText(spread)}`
          : ANNOUNCE[mode]}
      </p>
      {mode === "desk" && (
        <>
          <button type="button" className={styles.srFocusable} onClick={() => dispatchDesk({ type: "openDiary" })}>
            Open Shiv&apos;s diary
          </button>
          <button type="button" className={styles.srFocusable} onClick={() => dispatchDesk({ type: "openCamera" })}>
            Pick up the camera
          </button>
        </>
      )}
      {mode === "camera" && (
        <a className={styles.srFocusable} href={PHOTO_URL} target="_blank" rel="noopener noreferrer">
          Open Shiv&apos;s photography site
        </a>
      )}
      {mode === "diary" && (
        <>
          <button type="button" className={styles.srFocusable} onClick={() => dispatchDesk({ type: "prevPage" })}>
            Previous page
          </button>
          <button type="button" className={styles.srFocusable} onClick={() => dispatchDesk({ type: "nextPage" })}>
            Next page
          </button>
        </>
      )}
      <button
        type="button"
        aria-label="Scroll to about section"
        className={styles.scrollDown}
        onClick={() => {
          document.getElementById("about")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
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

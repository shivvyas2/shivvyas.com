import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useLenis } from "@studio-freight/react-lenis";
import { gsap, ScrollTrigger } from "@/libs/gsap";
import { useSceneLoading } from "./LoadingContext";
import { hasSeenIntro, markIntroSeen, sessionStore } from "./introSession.mjs";
import { MAX_WAIT_MS, SHOW_AFTER_MS, loaderCount, loaderGate } from "./loaderGate.mjs";

// Covers the page only while the home hero's 3D scene loads (never the rest of
// the site), capped at MAX_WAIT_MS. The orange counter panel appears only if
// that takes longer than SHOW_AFTER_MS; a fast load just fades into the hero.
export default function Loader() {
  const introRef = useRef<HTMLElement>(null);
  const percentageRef = useRef<HTMLSpanElement>(null);
  const count = useRef({ value: 0 });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finished, setFinished] = useState(false);
  const [counterShown, setCounterShown] = useState(false);
  const { sceneReady } = useSceneLoading();
  const router = useRouter();
  const lenis = useLenis();
  const { ready, showCounter } = loaderGate({
    needsScene: router.pathname === "/",
    sceneReady,
    elapsedMs,
  });

  useEffect(() => {
    // Repeat loads in the same tab go straight to the site.
    if (hasSeenIntro(sessionStore())) setFinished(true);
  }, []);

  // Elapsed time counts from navigation start (performance.now), so the cap
  // includes the time spent downloading and hydrating the page itself. Two
  // clock ticks are all the gate needs: when to show the counter, and the cap.
  useEffect(() => {
    if (finished) return;
    const tick = () => setElapsedMs(performance.now());
    tick();
    const timers = [SHOW_AFTER_MS, MAX_WAIT_MS].map((ms) =>
      window.setTimeout(tick, Math.max(0, ms - performance.now())),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [finished]);

  useEffect(() => {
    if (showCounter) setCounterShown(true);
  }, [showCounter]);

  useEffect(() => {
    if (finished) {
      markIntroSeen(sessionStore());
      ScrollTrigger.refresh();
      return;
    }
    const content = document.getElementById("site-content");
    const previousOverflow = document.documentElement.style.overflow;
    const previousInert = content?.inert ?? false;
    document.documentElement.style.overflow = "hidden";
    if (content) content.inert = true;
    lenis?.stop();
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      if (content) content.inert = previousInert;
      lenis?.start();
    };
  }, [finished, lenis]);

  const render = (value: number) => {
    if (percentageRef.current) percentageRef.current.textContent = `${Math.floor(value)}`;
  };

  // Count up every frame while waiting, so the number climbs 1-by-1.
  useEffect(() => {
    if (finished || !counterShown || ready) return;
    const shownAt = performance.now();
    let frame = 0;
    const step = () => {
      count.current.value = Math.max(
        count.current.value,
        loaderCount({ shownMs: performance.now() - shownAt }),
      );
      render(count.current.value);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [counterShown, ready, finished]);

  useEffect(() => {
    if (finished || !ready) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const done = () => setFinished(true);
    const timeline = gsap.timeline({ onComplete: done });
    if (reducedMotion) {
      timeline.set(introRef.current, { opacity: 0 });
    } else if (counterShown) {
      timeline
        // Finish the count (it keeps ticking through every number) before leaving.
        .to(count.current, {
          value: 100,
          duration: 0.12 + (100 - count.current.value) * 0.008,
          ease: "power1.out",
          onUpdate: () => render(count.current.value),
        })
        .to(percentageRef.current, { y: "-110%", duration: 0.35, ease: "power4.inOut" })
        .to(introRef.current, { y: "-100%", duration: 0.55, ease: "power4.inOut" }, "-=0.15");
    } else {
      timeline.to(introRef.current, { opacity: 0, duration: 0.25, ease: "power1.out" });
    }
    return () => {
      timeline.kill();
    };
  }, [ready, counterShown, finished]);

  if (finished) return null;

  return (
    <section
      ref={introRef}
      className={`intro ${counterShown ? "intro--shown" : ""}`}
      aria-label="Loading website"
      data-lenis-prevent
    >
      <span className="sr-only" role="status">
        Loading
      </span>
      <div className="intro-panel" aria-hidden="true">
        <div className="counter">
          <span ref={percentageRef}>0</span>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useLenis } from "@studio-freight/react-lenis";
import { gsap, ScrollTrigger } from "@/libs/gsap";
import { useSceneLoading } from "./LoadingContext";

export default function Loader() {
  const introRef = useRef<HTMLElement>(null);
  const percentageRef = useRef<HTMLSpanElement>(null);
  const count = useRef({ value: 0 });
  const [pageProgress, setPageProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const { sceneReady, sceneProgress } = useSceneLoading();
  const router = useRouter();
  const lenis = useLenis();
  const waitingForScene = router.pathname === "/" && !sceneReady;
  const ready = skipped || (pageProgress === 100 && !waitingForScene);
  const progress = ready
    ? 100
    : Math.min(
        99,
        Math.round(
          router.pathname === "/"
            ? pageProgress * 0.3 + (sceneReady ? 100 : sceneProgress) * 0.7
            : pageProgress,
        ),
      );

  useEffect(() => {
    if (finished) return;
    const controller = new AbortController();
    const { signal } = controller;
    const images = Array.from(document.images);
    let completed = 0;
    const track = (task: Promise<unknown>) =>
      task
        .catch(() => {})
        .then(() => {
          if (!signal.aborted)
            setPageProgress((++completed / (images.length + 2)) * 100);
        });

    const imageTasks = images.map((image) =>
      track(
        new Promise<void>((resolve) => {
          let settled = false;
          const settle = () => {
            if (settled) return;
            settled = true;
            image.removeEventListener("load", settle);
            image.removeEventListener("error", settle);
            // Decode before revealing, including images already in the browser cache.
            image
              .decode()
              .catch(() => {})
              .then(resolve);
          };
          image.addEventListener("load", settle, { signal });
          image.addEventListener("error", settle, { signal });
          signal.addEventListener("abort", () => resolve(), { once: true });
          // Warm the current page's pictures while the intro covers the site.
          image.loading = "eager";
          if (image.complete) settle();
        }),
      ),
    );
    const pageLoaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else
        window.addEventListener("load", () => resolve(), {
          once: true,
          signal,
        });
      signal.addEventListener("abort", () => resolve(), { once: true });
    });

    void Promise.all([
      ...imageTasks,
      track(document.fonts.ready),
      track(pageLoaded),
    ]);
    const skipTimer = window.setTimeout(() => setCanSkip(true), 8000);
    const timeout = window.setTimeout(() => setSkipped(true), 30000);
    return () => {
      controller.abort();
      window.clearTimeout(skipTimer);
      window.clearTimeout(timeout);
    };
  }, [finished]);

  useEffect(() => {
    if (finished) {
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

  useEffect(() => {
    if (finished) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timeline = gsap.timeline();
    timeline.to(count.current, {
      value: Math.max(count.current.value, progress),
      duration: reducedMotion ? 0 : 0.5,
      ease: "power1.out",
      onUpdate: () => {
        if (percentageRef.current)
          percentageRef.current.textContent = `${Math.floor(count.current.value)}`;
      },
    });
    if (ready) {
      timeline
        .to(percentageRef.current, {
          y: "-110%",
          duration: reducedMotion ? 0 : 1.2,
          ease: "power4.inOut",
        })
        .to(
          introRef.current,
          {
            y: "-100%",
            duration: reducedMotion ? 0 : 1.5,
            ease: "power4.inOut",
          },
          reducedMotion ? ">" : "-=0.5",
        )
        .call(() => {
          setFinished(true);
        });
    }
    return () => {
      timeline.kill();
    };
  }, [progress, ready, finished]);

  if (finished) return null;

  return (
    <section
      ref={introRef}
      className="intro"
      aria-label="Loading website"
      data-lenis-prevent
    >
      <span className="sr-only" role="status">
        Loading website assets
      </span>
      <div className="counter" aria-hidden="true">
        <span ref={percentageRef}>0</span>
      </div>
      {canSkip && !ready && (
        <button
          className="intro-skip"
          type="button"
          onClick={() => setSkipped(true)}
        >
          Continue to site
        </button>
      )}
    </section>
  );
}

"use client";
import { ReactLenis, useLenis } from "@studio-freight/react-lenis";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { gsap, ScrollTrigger } from "@/libs/gsap";

// Define props type for children
interface SmoothScrollingProps {
  children: ReactNode;
}

/**
 * Drives Lenis from GSAP's ticker and feeds its scroll events to ScrollTrigger.
 * Without this the two run on separate animation loops, so pinned and scrubbed
 * sections lag a frame or two behind the smoothed scroll and can slide past
 * their pin point on fast scrolls.
 */
function ScrollTriggerSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Sections measure themselves in their own effects; re-measure once the
    // whole page has mounted so every start/end reflects the final layout.
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(refresh);
      gsap.ticker.remove(raf);
      lenis.off("scroll", ScrollTrigger.update);
    };
  }, [lenis]);

  return null;
}

/**
 * Starts every new page at the top. Next.js resets the scroll on navigation, but a
 * Lenis glide still in progress from the previous page would carry on toward its old
 * target and scroll the new page down. Stopping Lenis when navigation starts and
 * jumping it to the top when the page is in place cancels that glide. Back and
 * forward keep the position the browser restores, and links to a #section still
 * scroll to that section.
 */
function RouteScrollReset() {
  const lenis = useLenis();
  const router = useRouter();

  useEffect(() => {
    if (!lenis) return;
    let popping = false;

    const onPop = () => {
      popping = true;
    };
    const onStart = () => lenis.stop();
    const onComplete = (url: string) => {
      const target = popping || url.includes("#") ? window.scrollY : 0;
      lenis.scrollTo(target, { immediate: true, force: true });
      popping = false;
      lenis.start();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    const onError = () => {
      popping = false;
      lenis.start();
    };

    window.addEventListener("popstate", onPop);
    router.events.on("routeChangeStart", onStart);
    router.events.on("routeChangeComplete", onComplete);
    router.events.on("routeChangeError", onError);
    return () => {
      window.removeEventListener("popstate", onPop);
      router.events.off("routeChangeStart", onStart);
      router.events.off("routeChangeComplete", onComplete);
      router.events.off("routeChangeError", onError);
    };
  }, [lenis, router]);

  return null;
}

export default function SmoothScrolling({ children }: SmoothScrollingProps) {
  const [smoothWheel, setSmoothWheel] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(
      "(min-width: 841px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const update = () => setSmoothWheel(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <ReactLenis
      root
      autoRaf={false}
      options={{ lerp: 0.12, smoothWheel, syncTouch: false }}
    >
      <ScrollTriggerSync />
      <RouteScrollReset />
      {children}
    </ReactLenis>
  );
}

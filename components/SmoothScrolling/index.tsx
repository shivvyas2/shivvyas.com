"use client";
import { ReactLenis, useLenis } from "@studio-freight/react-lenis";
import { ReactNode, useEffect } from "react";
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

export default function SmoothScrolling({ children }: SmoothScrollingProps) {
    return (
        <ReactLenis root autoRaf={false} options={{ lerp: 0.15, duration: 1.5 }}>
            <ScrollTriggerSync />
            {children}
        </ReactLenis>
    );
}

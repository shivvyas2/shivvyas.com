import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/libs/gsap';
import styles from './MacbookMockup.module.scss';

type MacbookMockupProps = {
    /** Web-ready MP4 served from /public */
    src: string;
    /** Still shown before the video starts and on save-data connections */
    poster?: string;
    /** Accessible label for the video */
    title: string;
};

/**
 * A CSS-drawn MacBook with a looping, muted video on its display.
 * The video only plays while the laptop is on screen.
 */
export default function MacbookMockup({ src, poster, title }: MacbookMockupProps) {
    const laptopRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const laptop = laptopRef.current;
        const video = videoRef.current;
        if (!laptop || !video) return;

        // Play only while visible so the loop doesn't burn battery off-screen
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {
                        /* autoplay blocked; the poster stays visible */
                    });
                } else {
                    video.pause();
                }
            },
            { threshold: 0.25 }
        );
        observer.observe(laptop);

        // Lid-open reveal as the laptop scrolls into view
        const reveal = gsap.from(laptop, {
            y: 80,
            opacity: 0,
            rotateX: 18,
            transformPerspective: 1600,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: laptop,
                start: 'top 85%',
            },
        });

        return () => {
            observer.disconnect();
            (reveal.scrollTrigger as ScrollTrigger | undefined)?.kill();
            reveal.kill();
        };
    }, []);

    return (
        <div className={styles.stage}>
            <div ref={laptopRef} className={styles.laptop}>
                <div className={styles.lid}>
                    <span className={styles.camera} aria-hidden="true" />
                    <div className={styles.display}>
                        <video
                            ref={videoRef}
                            src={src}
                            poster={poster}
                            title={title}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                        />
                    </div>
                </div>
                <div className={styles.base}>
                    <span className={styles.lip} aria-hidden="true" />
                </div>
                <div className={styles.shadow} aria-hidden="true" />
            </div>
        </div>
    );
}

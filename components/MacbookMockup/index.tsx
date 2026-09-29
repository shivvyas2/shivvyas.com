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

// Key counts per keyboard row, top to bottom. The last row is drawn separately
// so the space bar can be wide.
const KEY_ROWS = [13, 14, 14, 13, 12];

/**
 * A CSS-drawn MacBook Pro, seen straight on with the lid open, playing a
 * looping muted video on its display. The video only plays while visible.
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

        // Rise-and-settle reveal as the laptop scrolls into view
        const reveal = gsap.from(laptop, {
            y: 80,
            opacity: 0,
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
                {/* Lid: aluminium rim, black bezel, display */}
                <div className={styles.lid}>
                    <div className={styles.bezel}>
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
                        <span className={styles.brand} aria-hidden="true">MacBook Pro</span>
                    </div>
                </div>

                {/* Hinge line between lid and deck */}
                <div className={styles.hinge} aria-hidden="true" />

                {/* Deck: keyboard and trackpad, foreshortened toward the viewer */}
                <div className={styles.deckStage} aria-hidden="true">
                    <div className={styles.deck}>
                        <div className={styles.keyboard}>
                            <div className={styles.fnRow} />
                            {KEY_ROWS.map((count, r) => (
                                <div key={r} className={styles.keyRow}>
                                    {Array.from({ length: count }).map((_, k) => (
                                        <span key={k} className={styles.key} />
                                    ))}
                                </div>
                            ))}
                            <div className={`${styles.keyRow} ${styles.bottomRow}`}>
                                <span className={styles.key} />
                                <span className={styles.key} />
                                <span className={styles.key} />
                                <span className={`${styles.key} ${styles.wide}`} />
                                <span className={`${styles.key} ${styles.space}`} />
                                <span className={`${styles.key} ${styles.wide}`} />
                                <span className={styles.key} />
                                <span className={styles.arrows} />
                            </div>
                        </div>
                        <div className={styles.trackpad} />
                    </div>
                    <div className={styles.frontEdge}>
                        <span className={styles.lip} />
                    </div>
                </div>

                <div className={styles.shadow} aria-hidden="true" />
            </div>
        </div>
    );
}

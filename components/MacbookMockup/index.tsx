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

// Relative key widths per row, top to bottom, matching the 14-inch MacBook Pro
// layout: a full-height function row, then the five main rows. 1 is a standard
// key; wider keys use their approximate multiple of that width.
const KEY_ROWS: number[][] = [
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],            // esc, F1 to F12, Touch ID
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],            // numbers, delete
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],            // tab, QWERTY, backslash
    [1.85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.85],           // caps, ASDF, return
    [2.4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.4],                // shift, ZXCV, shift
];

/**
 * A CSS-drawn 14-inch MacBook Pro (2021 and later body), seen straight on with
 * the lid open, playing a looping muted video on its display. Proportions come
 * from the real device: 31.26 x 22.12 cm footprint, 3024 x 1964 display with a
 * notch, full-height function row, 12.9 x 8.1 cm trackpad.
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
                        <div className={styles.display}>
                            <span className={styles.notch} aria-hidden="true">
                                <span className={styles.camera} />
                            </span>
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
                </div>

                {/* Hinge line between lid and deck */}
                <div className={styles.hinge} aria-hidden="true" />

                {/* Deck: keyboard and trackpad, foreshortened toward the viewer */}
                <div className={styles.deckStage} aria-hidden="true">
                    <div className={styles.deck}>
                        <div className={styles.keyboard}>
                            {KEY_ROWS.map((row, r) => (
                                <div key={r} className={styles.keyRow}>
                                    {row.map((width, k) => (
                                        <span key={k} className={styles.key} style={{ flex: width }} />
                                    ))}
                                </div>
                            ))}
                            {/* fn, control, option, command, space, command, option, arrows */}
                            <div className={styles.keyRow}>
                                <span className={styles.key} style={{ flex: 1 }} />
                                <span className={styles.key} style={{ flex: 1 }} />
                                <span className={styles.key} style={{ flex: 1 }} />
                                <span className={styles.key} style={{ flex: 1.3 }} />
                                <span className={styles.key} style={{ flex: 5.6 }} />
                                <span className={styles.key} style={{ flex: 1.3 }} />
                                <span className={styles.key} style={{ flex: 1 }} />
                                <span className={styles.arrows} style={{ flex: 3 }} />
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

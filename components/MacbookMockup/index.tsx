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

// Lid angle, in degrees from fully open, at the start of the scroll sequence.
const CLOSED_ANGLE = 86;
// The whole laptop is viewed from slightly above while the lid is closed, then
// settles to a straight-on view as it opens.
const CLOSED_TILT = 12;
// Scroll progress at which the display lights up and the video starts.
const WAKE_AT = 0.45;

/**
 * A space black MacBook Pro seen straight on, drawn in CSS, with a video on its
 * display. On desktop the section pins and the lid opens as the visitor scrolls,
 * in the style of Apple's product pages. On small screens, or when the visitor
 * prefers reduced motion, the laptop is simply shown open.
 */
export default function MacbookMockup({ src, poster, title }: MacbookMockupProps) {
    const stageRef = useRef<HTMLDivElement | null>(null);
    const laptopRef = useRef<HTMLDivElement | null>(null);
    const lidRef = useRef<HTMLDivElement | null>(null);
    const dimRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const stage = stageRef.current;
        const laptop = laptopRef.current;
        const lid = lidRef.current;
        const dim = dimRef.current;
        const video = videoRef.current;
        if (!stage || !laptop || !lid || !dim || !video) return;

        // The video runs only while the laptop is on screen and its lid is open
        // enough for the display to be lit.
        let inView = false;
        let awake = true;
        const syncPlayback = () => {
            if (inView && awake) {
                video.play().catch(() => {
                    /* autoplay blocked; the poster stays visible */
                });
            } else {
                video.pause();
            }
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                inView = entry.isIntersecting;
                syncPlayback();
            },
            { threshold: 0.2 }
        );
        observer.observe(laptop);

        const mm = gsap.matchMedia();

        mm.add('(min-width: 841px) and (prefers-reduced-motion: no-preference)', () => {
            awake = false;

            const tl = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                    trigger: stage,
                    start: 'top top',
                    end: '+=140%',
                    pin: true,
                    scrub: 0.6,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        const next = self.progress >= WAKE_AT;
                        if (next !== awake) {
                            awake = next;
                            syncPlayback();
                        }
                    },
                },
            });

            tl.fromTo(lid, { rotateX: CLOSED_ANGLE }, { rotateX: 0, duration: 1 }, 0)
                .fromTo(
                    laptop,
                    { rotateX: CLOSED_TILT, scale: 0.9, yPercent: 6 },
                    { rotateX: 0, scale: 1, yPercent: 0, duration: 1, ease: 'power1.out' },
                    0
                )
                // Screen stays dark until the lid is most of the way open
                .fromTo(dim, { opacity: 1 }, { opacity: 0, duration: 0.35 }, WAKE_AT - 0.1);

            return () => {
                awake = true;
                syncPlayback();
            };
        });

        return () => {
            observer.disconnect();
            mm.revert();
        };
    }, []);

    return (
        <div ref={stageRef} className={styles.stage}>
            <div className={styles.scene}>
                <div ref={laptopRef} className={styles.laptop}>
                    {/* Lid: space black rim, black bezel, display with notch */}
                    <div ref={lidRef} className={styles.lid}>
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
                                <div ref={dimRef} className={styles.dim} aria-hidden="true" />
                            </div>
                        </div>
                    </div>

                    {/* Base: only the front edge is visible from straight on */}
                    <div className={styles.base} aria-hidden="true">
                        <span className={styles.deck} />
                        <span className={styles.lip} />
                    </div>

                    <div className={styles.shadow} aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}

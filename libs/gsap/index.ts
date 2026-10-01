import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Phones resize the viewport when the address bar shows or hides; refreshing
// every ScrollTrigger mid-scroll makes pinned/sticky sections jump.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };

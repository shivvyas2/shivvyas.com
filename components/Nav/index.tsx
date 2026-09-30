import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLenis } from "@studio-freight/react-lenis";
import { gsap } from "@/libs/gsap";
import BrandMark from "@/components/BrandMark";
import styles from "./Nav.module.scss";

const links = [
  { name: "Home", path: "/" },
  { name: "About me", path: "/about" },
  { name: "Projects", path: "/projects" },
  { name: "Contact", path: "/contact" },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const lenis = useLenis();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!menuOpen) {
      if (dialog.open) {
        dialog.close();
        toggleRef.current?.focus();
      }
      return;
    }

    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap
        .timeline()
        .fromTo(
          dialog,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.8,
            ease: "power4.inOut",
          },
        )
        .fromTo(
          dialog.querySelectorAll("li a"),
          { y: "-100%" },
          {
            y: "0%",
            duration: 0.8,
            stagger: 0.05,
            ease: "power4.inOut",
          },
          "-=0.3",
        );
    });
    return () => {
      media.revert();
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [menuOpen, lenis]);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, [router.events]);

  const header = (isDialog: boolean) => (
    <nav
      className={styles.nav}
      aria-label={isDialog ? "Menu controls" : "Primary navigation"}
      style={!isDialog && menuOpen ? { visibility: "hidden" } : undefined}
    >
      <Link
        href="/"
        className={styles.logo}
        aria-label="Shiv Vyas — home"
        onClick={() => setMenuOpen(false)}
      >
        <span className={styles.brandGlow} aria-hidden="true">
          <BrandMark variant="isometric" className={styles.brandMark} />
        </span>
        <span className={styles.wordmark}>Shiv Vyas</span>
      </Link>
      <button
        type="button"
        ref={isDialog ? undefined : toggleRef}
        className={styles.menu_Toggle}
        aria-label={isDialog ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="site-menu"
        autoFocus={isDialog}
        onClick={() => setMenuOpen(!isDialog)}
      >
        <span className={styles.bar} aria-hidden="true" />
        <span>{isDialog ? "CLOSE" : "MENU"}</span>
      </button>
      <Link
        href="/contact"
        className={styles.link}
        onClick={() => setMenuOpen(false)}
      >
        <span>Contact</span>
      </Link>
    </nav>
  );

  return (
    <>
      {header(false)}
      <dialog
        id="site-menu"
        ref={dialogRef}
        className={styles.navigationMenu}
        aria-label="Site navigation"
        onCancel={() => setMenuOpen(false)}
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}
      >
        {header(true)}
        <ul>
          {links.map(({ name, path }) => (
            <li key={path}>
              <Link
                href={path}
                aria-current={router.pathname === path ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}

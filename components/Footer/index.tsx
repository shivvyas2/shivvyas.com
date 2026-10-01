import Link from "next/link";
import styles from "./Footer.module.scss";
import BrandMark from "@/components/BrandMark";

// address
const contactInfo = <p>New York</p>;

// Navigation links
const navigationLinks = [
  { text: "Home", href: "/" },
  { text: "About", href: "/about" },
  { text: "Projects", href: "/projects" },
  { text: "Contact", href: "/contact" },
].map(({ text, href }) => (
  <Link key={text} href={href}>
    {text}
  </Link>
));

// Social links
const socialLinks = [
  { text: "Instagram", href: "https://www.instagram.com/shivvyas_/" },
  { text: "Linkedin", href: "https://www.linkedin.com/in/shivvyas/" },
  { text: "Youtube", href: "https://www.youtube.com/@ShivVyas" },
  { text: "Github", href: "https://github.com/shivvyas2" },
  { text: "Photography", href: "https://awannabephotographer.shivvyas.com" },
].map(({ text, href }) => (
  // rel="me" tells crawlers these profiles belong to the site owner.
  <Link key={text} href={href} target="_blank" rel="me noopener noreferrer">
    {text}
  </Link>
));

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.col}>
            <Link
              href="/"
              className={styles.brand}
              aria-label="Shiv Vyas — home"
            >
              <BrandMark variant="isometric" size={80} />
            </Link>
            {contactInfo}
            <Link href="mailto:shivvyas0209@gmail.com">
              shivvyas0209@gmail.com
            </Link>
          </div>
          <div className={styles.linksCol}>{navigationLinks}</div>
        </div>
        <div className={styles.border} />
        <div className={styles.copyrights}>
          <div className={styles.linksCol}>{socialLinks}</div>
        </div>
      </div>
      <h2 className={styles.bigText}>Shiv Vyas</h2>
    </footer>
  );
};

export default Footer;

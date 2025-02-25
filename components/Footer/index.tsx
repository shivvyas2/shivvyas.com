import Link from 'next/link';
import styles from './Footer.module.scss';

// address
const contactInfo = (
    <p> <br />
        <br />
        New York
    </p>
);

// Navigation links
const navigationLinks = [
    { text: 'Home', href: '/' },
    { text: 'About', href: '/about' },
    { text: 'Projects', href: '/projects' },
    { text: 'Contact', href: '/contact' },
].map(({ text, href }) => (
    <Link key={text} href={href}>{text}</Link>
));

// Social links
const socialLinks = [
    { text: 'Instagram', href: 'https://www.instagram.com/shivvyas_/' },
    { text: 'Linkedin', href: 'https://www.linkedin.com/in/shivvyas/' },
    { text: 'Youtube', href: 'https://www.youtube.com/@ShivVyas' },
    { text: 'Github', href: 'https://github.com/shivvyas2' },
].map(({ text, href }) => (
    <Link key={text} href={href} target="_blank" rel="noopener noreferrer">{text}</Link>
));

const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    <div className={styles.col}>
                        {contactInfo}
                        <Link href='mailto:mrzaidsaeed@gmail.com'>shivvyas0209@gmail.com</Link>
                    </div>
                    <div className={styles.linksCol}>
                        {navigationLinks}
                    </div>
                </div>
                <div className={styles.border} />
                <div className={styles.copyrights}>
                   
                    <div className={styles.linksCol}>
                        {socialLinks}
                    </div>
                </div>
            </div>
            <h2 className={styles.bigText}>Shiv Vyas</h2>
        </footer>
    );
};

export default Footer;


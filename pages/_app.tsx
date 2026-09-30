import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import SmoothScrolling from "@/components/SmoothScrolling";
import "@/styles/globals.scss";
import type { AppProps } from "next/app";
import { MotionConfig } from "framer-motion";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MotionConfig reducedMotion="user">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#080808" />
        <meta name="author" content="Shiv Vyas" />
        <link
          rel="icon"
          type="image/x-icon"
          href="/favicon.ico"
          sizes="16x16 32x32 48x48"
        />
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SmoothScrolling>
        <Nav />
        <main id="main-content" tabIndex={-1}>
          <Component {...pageProps} />
        </main>
        <Footer />
      </SmoothScrolling>
    </MotionConfig>
  );
}

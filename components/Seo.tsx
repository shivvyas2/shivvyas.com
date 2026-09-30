import Head from "next/head";
import { SITE_URL } from "@/data/site";

type SeoProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  structuredData?: Record<string, unknown>;
};

export default function Seo({
  title,
  description,
  path,
  image = "/images/shiv-vyas-social.png",
  imageAlt = "Shiv Vyas — Software Engineer in New York",
  structuredData,
}: SeoProps) {
  const canonical = `${SITE_URL}${path}`;
  const imageUrl = new URL(image, SITE_URL).href;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} key="description" />
      <link rel="canonical" href={canonical} key="canonical" />
      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:site_name" content="Shiv Vyas" key="og:site_name" />
      <meta property="og:locale" content="en_US" key="og:locale" />
      <meta property="og:title" content={title} key="og:title" />
      <meta
        property="og:description"
        content={description}
        key="og:description"
      />
      <meta property="og:url" content={canonical} key="og:url" />
      <meta property="og:image" content={imageUrl} key="og:image" />
      <meta property="og:image:alt" content={imageAlt} key="og:image:alt" />
      <meta
        name="twitter:card"
        content="summary_large_image"
        key="twitter:card"
      />
      <meta name="twitter:title" content={title} key="twitter:title" />
      <meta
        name="twitter:description"
        content={description}
        key="twitter:description"
      />
      <meta name="twitter:image" content={imageUrl} key="twitter:image" />
      <meta
        name="twitter:image:alt"
        content={imageAlt}
        key="twitter:image:alt"
      />
      {structuredData && (
        <script
          key="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </Head>
  );
}

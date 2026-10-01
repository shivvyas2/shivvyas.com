import Head from "next/head";
import { SITE_URL, profiles } from "@/data/site";

type SeoProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  structuredData?: Record<string, unknown>;
  type?: "website" | "profile" | "article";
};

const DEFAULT_IMAGE = "/images/shiv-vyas-social.png";

export default function Seo({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  imageAlt = "Shiv Vyas — Software Engineer in New York",
  structuredData,
  type = "website",
}: SeoProps) {
  const canonical = `${SITE_URL}${path}`;
  const imageUrl = new URL(image, SITE_URL).href;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} key="description" />
      <link rel="canonical" href={canonical} key="canonical" />
      <meta name="author" content="Shiv Vyas" key="author" />
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        key="robots"
      />
      {/* Head-only identity links: tell crawlers these profiles are the same person. */}
      {profiles.map((href) => (
        <link rel="me" href={href} key={`me:${href}`} />
      ))}
      <meta property="og:type" content={type} key="og:type" />
      {type === "profile" && (
        <>
          <meta property="profile:first_name" content="Shiv" key="profile:first_name" />
          <meta property="profile:last_name" content="Vyas" key="profile:last_name" />
          <meta property="profile:username" content="shivvyas" key="profile:username" />
        </>
      )}
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
      {image === DEFAULT_IMAGE && (
        <>
          <meta property="og:image:width" content="1200" key="og:image:width" />
          <meta property="og:image:height" content="630" key="og:image:height" />
        </>
      )}
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

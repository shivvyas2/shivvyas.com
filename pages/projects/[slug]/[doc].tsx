import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import Seo from "@/components/Seo";
import { legalDocs, LegalDoc } from "@/data/legalDocs";
import { breadcrumbs } from "@/data/site";
import styles from "./LegalPage.module.scss";

const DOC_LABELS = { privacy: "Privacy Policy", terms: "Terms of Use", eula: "EULA" } as const;
type DocKey = keyof typeof DOC_LABELS;

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: Object.entries(legalDocs).flatMap(([slug, app]) =>
    Object.keys(app.docs).map((doc) => ({ params: { slug, doc } })),
  ),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug as string;
  const doc = params!.doc as DocKey;
  const app = legalDocs[slug];
  if (!app?.docs[doc]) return { notFound: true };
  return { props: { slug, docKey: doc, app: app.app, doc: app.docs[doc] } };
};

type Props = { slug: string; docKey: DocKey; app: string; doc: LegalDoc };

const LegalPage = ({ slug, docKey, app, doc }: Props) => {
  const path = `/projects/${slug}/${docKey}`;
  return (
    <>
      <Seo
        title={`${app} ${doc.title} | Shiv Vyas`}
        description={doc.summary}
        path={path}
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Projects", path: "/projects" },
              { name: app, path: `/projects/${slug}` },
              { name: doc.title, path },
            ]),
          ],
        }}
      />
      <main className={styles.legal}>
        <nav className={styles.tabs} aria-label={`${app} legal documents`}>
          <Link href={`/projects/${slug}`}>{app}</Link>
          {(Object.keys(DOC_LABELS) as DocKey[]).map((k) => (
            <Link key={k} href={`/projects/${slug}/${k}`} aria-current={k === docKey ? "page" : undefined}>
              {DOC_LABELS[k]}
            </Link>
          ))}
        </nav>
        <header>
          <p className={styles.eyebrow}>{app}</p>
          <h1>{doc.title}</h1>
          <p className={styles.meta}>Effective {doc.effective}</p>
          <p className={styles.summary}>{doc.summary}</p>
        </header>
        {doc.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}
      </main>
    </>
  );
};

export default LegalPage;

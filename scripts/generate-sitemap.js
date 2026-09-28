const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

// Pull the project slugs straight out of the TypeScript data file. Matching
// slugs (rather than eval-ing the whole array) keeps this working when the
// file gains type annotations or nested arrays.
const projectsFilePath = path.join(process.cwd(), 'data', 'projectsData.ts');
const projectsFileContent = fs.readFileSync(projectsFilePath, 'utf8');
const projects = [...projectsFileContent.matchAll(/^\s*slug:\s*["'`]([^"'`]+)["'`]/gm)].map(
  (match) => ({ slug: match[1] })
);
if (projects.length === 0) {
  throw new Error('generate-sitemap: no project slugs found in data/projectsData.ts');
}

const BASE_URL = 'https://shivvyas.com';

async function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${BASE_URL}</loc><lastmod>${currentDate}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
<url><loc>${BASE_URL}/about</loc><lastmod>${currentDate}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
<url><loc>${BASE_URL}/contact</loc><lastmod>${currentDate}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
<url><loc>${BASE_URL}/projects</loc><lastmod>${currentDate}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>${projects
    .map(
      (project) =>
        `<url><loc>${BASE_URL}/projects/${project.slug}</loc><lastmod>${currentDate}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
    )
    .join('')}</urlset>`;

  // Write the sitemap without prettier formatting to keep it compact
  fs.writeFileSync(
    path.join(process.cwd(), 'public', 'sitemap.xml'),
    sitemap
  );
}

generateSitemap();

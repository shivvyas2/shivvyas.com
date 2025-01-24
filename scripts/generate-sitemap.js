const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

// Read and parse the projects data directly from the TypeScript file
const projectsFilePath = path.join(process.cwd(), 'data', 'projectsData.ts');
const projectsFileContent = fs.readFileSync(projectsFilePath, 'utf8');
const projectsMatch = projectsFileContent.match(/export const projects = (\[[\s\S]*?\]);/);
const projects = eval(projectsMatch[1]);

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

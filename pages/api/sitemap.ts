import { NextApiRequest, NextApiResponse } from 'next';
import { projects } from '../../data/projectsData';

const BASE_URL = 'https://shivvyas.com';

function generateSiteMap() {
  const currentDate = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <!-- Static pages -->
      <url>
        <loc>${BASE_URL}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${BASE_URL}/about</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>${BASE_URL}/contact</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>${BASE_URL}/projects</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
      </url>
      
      <!-- Dynamic project pages -->
      ${projects
        .map((project) => {
          return `
        <url>
          <loc>${BASE_URL}/projects/${project.slug}</loc>
          <lastmod>${currentDate}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>0.7</priority>
        </url>`;
        })
        .join('')}
    </urlset>`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const sitemap = generateSiteMap();

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();
}

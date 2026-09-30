const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(process.cwd(), "data/projectsData.ts"),
  "utf8",
);
const slugs = [...source.matchAll(/^\s*slug:\s*["'`]([^"'`]+)["'`]/gm)].map(
  (match) => match[1],
);
if (!slugs.length || new Set(slugs).size !== slugs.length) {
  throw new Error("Sitemap requires unique project slugs.");
}

const baseUrl = "https://www.shivvyas.com";
const routes = [
  "/",
  "/about",
  "/contact",
  "/projects",
  ...slugs.map((slug) => `/projects/${encodeURIComponent(slug)}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${baseUrl}${route}</loc></url>`).join("\n")}\n</urlset>\n`;
// Do not invent modification dates on every deployment.
fs.writeFileSync(path.join(process.cwd(), "public/sitemap.xml"), sitemap);
console.log(`Generated sitemap with ${routes.length} canonical URLs.`);

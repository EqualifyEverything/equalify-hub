// Static files: robots.txt, sitemap.xml, security.txt, humans.txt
import type { Context } from 'hono';
import config from '#src/utils/config';

export const robots = (c: Context) => {
    return c.text(`User-agent: *
Allow: /

# ${config.siteName} - Developer tools for ${config.githubOrg}
# https://opensource.equalifyapp.com

Sitemap: https://opensource.equalifyapp.com/sitemap.xml`);
};

export const sitemap = (c: Context) => {
    const pages = [
        { loc: 'https://opensource.equalifyapp.com/', priority: '1.0', changefreq: 'daily' },
        { loc: 'https://opensource.equalifyapp.com/about', priority: '0.8', changefreq: 'monthly' },
        { loc: `https://opensource.equalifyapp.com/${config.githubOrg}`, priority: '0.9', changefreq: 'daily' },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return c.body(xml, 200, { 'Content-Type': 'application/xml' });
};

export const security = (c: Context) => {
    return c.text(`Contact: https://github.com/${config.githubOrg}
Preferred-Languages: en
Canonical: https://opensource.equalifyapp.com/.well-known/security.txt`);
};

export const humans = (c: Context) => {
    return c.text(`/* TEAM */
Organization: ${config.githubOrg}
Site: ${config.equalifyAppUrl}
GitHub: @${config.githubOrg}

/* SITE */
Built with: TypeScript, Node.js, AWS Lambda
Last updated: 2026
Standards: HTML5, CSS3
Philosophy: Fast, accessible developer tools for open source.

/* THANKS */
GitHub - for the API
UIC - for the support
You - for contributing`);
};

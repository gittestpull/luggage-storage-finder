import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const protocol = request.nextUrl.protocol;
  const host = request.nextUrl.host;
  const baseUrl = `${protocol}//${host}`;

  const urls = [
    {
      loc: baseUrl,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      loc: `${baseUrl}/news`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '0.8',
    },
    // The FAQ link is a client-side route on the homepage.
    // We can represent it by the homepage URL itself.
    {
        loc: `${baseUrl}/#faq`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.7',
    }
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
    <url>
      <loc>${url.loc}</loc>
      <lastmod>${url.lastmod}</lastmod>
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority}</priority>
    </url>
  `
    )
    .join('')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

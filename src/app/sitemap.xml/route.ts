import { NextRequest, NextResponse } from 'next/server';
import { menuLinks } from '@/config/navigation';

export async function GET(request: NextRequest) {
  const protocol = request.nextUrl.protocol;
  const host = request.nextUrl.host;
  const baseUrl = `${protocol}//${host}`;

  const urls = menuLinks.map((link) => {
    return {
      loc: `${baseUrl}${link.path}`,
      lastmod: new Date().toISOString(),
      // You can customize changefreq and priority based on the link
      changefreq: 'daily',
      priority: '0.8',
    };
  });

  // Add the homepage with a higher priority
  const homeUrl = {
    loc: baseUrl,
    lastmod: new Date().toISOString(),
    changefreq: 'daily',
    priority: '1.0',
  };

  const allUrls = [homeUrl, ...urls.filter(url => url.loc !== baseUrl)];


  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls
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

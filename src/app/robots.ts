import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://my-luggage-app.duckdns.org';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/*', '/admin/*', '/mgmt-secure/*'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}

import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import { Storage } from '@/models';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://my-luggage-app.duckdns.org';

    // 1. Static Routes
    const routes = [
        '',
        '/news',
        '/contact',
        '/fun',
        '/terms',
        '/privacy',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // 2. Dynamic Routes (Storage Places)
    let placeRoutes: MetadataRoute.Sitemap = [];
    try {
        await dbConnect();
        const places = await Storage.find({ 'status.isOpen': true }).select('_id createdAt').lean();

        placeRoutes = places.map((place) => ({
            url: `${baseUrl}/places/${place._id}`,
            lastModified: place.createdAt || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));
    } catch (error) {
        console.error('Sitemap generation error:', error);
    }

    return [...routes, ...placeRoutes];
}

import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * Everything requiring auth (dashboards, settings, booking flow, messages,
 * notifications, favorites, payments, reviews-of-mine) is a private, per-account view
 * — indexing it would either 404 for the crawler (no session) or leak another user's
 * data into search results if it somehow rendered. Only the public marketing/discovery
 * surface is crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/auth/',
        '/dashboard/',
        '/settings/',
        '/booking/',
        '/messages/',
        '/notifications/',
        '/favorites/',
        '/payments/',
        '/reviews/',
        '/api/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

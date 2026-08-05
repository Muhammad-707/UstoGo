/** Canonical site origin — every absolute URL (sitemap, robots, OG, canonical, JSON-LD) goes through this. */
export const SITE_URL = 'https://ustogo.vercel.app';

export const absoluteUrl = (path: string = ''): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

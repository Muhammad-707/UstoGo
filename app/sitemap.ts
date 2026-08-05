import type { MetadataRoute } from 'next';
import { categoriesApi, mastersApi } from '@/lib/api/endpoints';
import type { Category } from '@/lib/api/types';
import { SITE_URL } from '@/lib/seo';

const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/home', changeFrequency: 'daily', priority: 0.9 },
  { path: '/search', changeFrequency: 'daily', priority: 0.9 },
  { path: '/categories', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/auth/login', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/auth/register/client', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/auth/register/master', changeFrequency: 'yearly', priority: 0.4 },
];

const flattenCategories = (categories: Category[]): Category[] =>
  categories.flatMap((category) => [category, ...flattenCategories(category.children ?? [])]);

/**
 * Master profiles and category pages are the pages actually worth a search engine's
 * time (SEO §6.12) — everything under auth/dashboard/settings is excluded here and
 * disallowed outright in `robots.ts`, since a crawler indexing a login form or another
 * user's private dashboard helps no one.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const categoryTree = await categoriesApi.tree();
    for (const category of flattenCategories(categoryTree)) {
      entries.push({
        url: `${SITE_URL}/search?category=${category.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch {
    // A backend hiccup should not fail the whole sitemap — the static routes above
    // still cover the pages that matter most.
  }

  try {
    const masters = await mastersApi.search({ limit: 100, sort: 'rating:desc' });
    for (const master of masters.items) {
      entries.push({
        url: `${SITE_URL}/master/${master.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // Same reasoning — a slow/unavailable API degrades the sitemap, not the build.
  }

  return entries;
}

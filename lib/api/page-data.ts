import { unstable_cache } from 'next/cache';
import { cookies } from 'next/headers';
import { categoriesApi, mastersApi } from './endpoints';
import { resolveCategoryId } from './category-utils';
import type { Category, MasterPublic } from './types';

interface HomePageData {
  categories: Category[];
  topMasters: MasterPublic[];
  allMasters: MasterPublic[];
}

interface SearchPageData {
  categories: Category[];
  initialMasters: MasterPublic[];
  totalPages: number;
  total: number;
}

// Data is fetched once on the server and reused for a short window, so the first
// paint includes the results instead of waiting for a client-side round trip. Any
// master-affecting mutation (services, schedule, portfolio, avatar/banner, approval)
// calls POST /api/revalidate to clear the 'masters' tag on demand — see
// lib/api/revalidate.ts — so this window is just a fallback ceiling on staleness,
// not the primary invalidation mechanism.
const REVALIDATE_SECONDS = 30;
const MASTERS_TAG = 'masters';

/**
 * The viewer's language, read from the same cookie `i18n/actions.ts` writes. A server
 * component has no `document`, so the API client cannot infer it and used to send
 * `X-Locale: en` on every server-rendered request — which is why category and service
 * names stayed English however the UI was switched. It is also part of the cache key:
 * one cached copy shared across three languages would serve whichever arrived first.
 */
const viewerLocale = async (): Promise<string> => {
  const store = await cookies();
  return store.get('ustogo-lang')?.value ?? 'en';
};

const EMPTY_HOME_DATA: HomePageData = { categories: [], topMasters: [], allMasters: [] };
const EMPTY_SEARCH_DATA: SearchPageData = { categories: [], initialMasters: [], totalPages: 0, total: 0 };

// The backend (Render free tier) can be asleep or briefly unreachable. These pages
// are rendered on the server, so a thrown ApiError/network error here would crash
// the whole request with Next's "unexpected error" overlay instead of just showing
// an empty state — callers degrade gracefully and the client can retry on refresh.
const landingData = unstable_cache(
  async (locale: string): Promise<HomePageData> => {
    try {
      const [categories, top, all] = await Promise.all([
        categoriesApi.tree(locale),
        mastersApi.search({ limit: 3, sort: 'rating:desc' }, locale),
        mastersApi.search({ limit: 100 }, locale),
      ]);
      return { categories, topMasters: top.items, allMasters: all.items };
    } catch {
      return EMPTY_HOME_DATA;
    }
  },
  ['home-page', 'landing'],
  { revalidate: REVALIDATE_SECONDS, tags: [MASTERS_TAG] }
);

const homeData = unstable_cache(
  async (locale: string): Promise<HomePageData> => {
    try {
      const [categories, top, all] = await Promise.all([
        categoriesApi.tree(locale),
        mastersApi.search({ limit: 6, sort: 'rating:desc' }, locale),
        mastersApi.search({ limit: 100 }, locale),
      ]);
      return { categories, topMasters: top.items, allMasters: all.items };
    } catch {
      return EMPTY_HOME_DATA;
    }
  },
  ['home-page', 'home'],
  { revalidate: REVALIDATE_SECONDS, tags: [MASTERS_TAG] }
);

const searchData = unstable_cache(
  async (locale: string, categoryId: string | null | undefined): Promise<SearchPageData> => {
    try {
      const categories = await categoriesApi.tree(locale);
      const id = resolveCategoryId(categoryId, categories);
      const res = await mastersApi.search({ categoryId: id, maxPrice: 500, page: 1, limit: 20 }, locale);
      return { categories, initialMasters: res.items, totalPages: res.meta.totalPages, total: res.meta.total };
    } catch {
      return EMPTY_SEARCH_DATA;
    }
  },
  ['search-page'],
  { revalidate: REVALIDATE_SECONDS, tags: [MASTERS_TAG] }
);

// The exported wrappers resolve the locale first, so every caller keeps its old
// signature and no page has to know the cookie exists.
export const getLandingData = async (): Promise<HomePageData> => landingData(await viewerLocale());
export const getHomeData = async (): Promise<HomePageData> => homeData(await viewerLocale());
export const getSearchData = async (
  categoryId?: string | null,
): Promise<SearchPageData> => searchData(await viewerLocale(), categoryId);

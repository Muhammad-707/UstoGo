import { unstable_cache } from 'next/cache';
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

// Data is fetched once on the server and reused for 60s, so the first paint
// includes the results instead of waiting for a client-side round trip.
const REVALIDATE_SECONDS = 60;

export const getLandingData = unstable_cache(
  async (): Promise<HomePageData> => {
    const [categories, top, all] = await Promise.all([
      categoriesApi.tree(),
      mastersApi.search({ limit: 3, sort: 'rating:desc' }),
      mastersApi.search({ limit: 100 }),
    ]);
    return { categories, topMasters: top.items, allMasters: all.items };
  },
  ['home-page', 'landing'],
  { revalidate: REVALIDATE_SECONDS }
);

export const getHomeData = unstable_cache(
  async (): Promise<HomePageData> => {
    const [categories, top, all] = await Promise.all([
      categoriesApi.tree(),
      mastersApi.search({ limit: 6, sort: 'rating:desc' }),
      mastersApi.search({ limit: 100 }),
    ]);
    return { categories, topMasters: top.items, allMasters: all.items };
  },
  ['home-page', 'home'],
  { revalidate: REVALIDATE_SECONDS }
);

export const getSearchData = unstable_cache(
  async (categoryId: string | null | undefined): Promise<SearchPageData> => {
    const categories = await categoriesApi.tree();
    const id = resolveCategoryId(categoryId, categories);
    const res = await mastersApi.search({ categoryId: id, maxPrice: 500, page: 1, limit: 20 });
    return { categories, initialMasters: res.items, totalPages: res.meta.totalPages, total: res.meta.total };
  },
  ['search-page'],
  { revalidate: REVALIDATE_SECONDS }
);

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SearchClient from './SearchClient';
import { getSearchData } from '@/lib/api/page-data';
import type { Category } from '@/lib/api/types';

const findCategoryName = (categories: Category[], id: string): string | null => {
  for (const category of categories) {
    if (category.id === id) return category.name;
    const nested = findCategoryName(category.children ?? [], id);
    if (nested !== null) return nested;
  }
  return null;
};

type SearchPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const t = await getTranslations('common');
  const params = await searchParams;
  const category = typeof params?.category === 'string' ? params.category : null;

  if (category === null) {
    return {
      title: t('searchMasters'),
      alternates: { canonical: '/search' },
    };
  }

  const data = await getSearchData(category);
  const categoryName = findCategoryName(data.categories, category);
  const title = categoryName === null ? t('searchMasters') : `${categoryName} — ${t('searchMasters')}`;

  return { title, alternates: { canonical: `/search?category=${category}` } };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const category = typeof params?.category === 'string' ? params.category : null;
  const data = await getSearchData(category);

  return (
    <SearchClient
      categories={data.categories}
      initialMasters={data.initialMasters}
      initialTotalPages={data.totalPages}
      initialTotal={data.total}
      initialCategory={category ?? 'all'}
    />
  );
}

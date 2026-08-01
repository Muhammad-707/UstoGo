import SearchClient from './SearchClient';
import { getSearchData } from '@/lib/api/page-data';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
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

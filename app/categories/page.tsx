import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import CategoriesClient from './CategoriesClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('categories');
  const title = t('title');
  const description = t('subtitle');

  return {
    title,
    description,
    alternates: { canonical: '/categories' },
    openGraph: { title, description, url: '/categories' },
  };
}

export default function CategoriesPage() {
  return <CategoriesClient />;
}

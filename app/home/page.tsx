import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ClientHomePage from './HomeClient';
import { getHomeData } from '@/lib/api/page-data';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  const title = t('heroTitlePrefix') + ' ' + t('heroTitleHighlight');

  return {
    title,
    description: t('metaDescription'),
    alternates: { canonical: '/home' },
    openGraph: { title, description: t('metaDescription'), url: '/home' },
  };
}

export default async function HomePage() {
  const data = await getHomeData();
  return (
    <ClientHomePage categories={data.categories} topMasters={data.topMasters} allMasters={data.allMasters} />
  );
}

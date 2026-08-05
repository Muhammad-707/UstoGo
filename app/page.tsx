import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import LandingClient from '@/components/landing/LandingClient';
import { getLandingData } from '@/lib/api/page-data';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');

  return {
    title: { absolute: t('metaTitle') },
    description: t('metaDescription'),
    alternates: { canonical: '/' },
  };
}

export default async function LandingPage() {
  const data = await getLandingData();
  return (
    <LandingClient categories={data.categories} topMasters={data.topMasters} allMasters={data.allMasters} />
  );
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AboutClient from './AboutClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  const title = t('title');
  const description = t('description');

  return {
    title,
    description,
    alternates: { canonical: '/about' },
    openGraph: { title, description, url: '/about' },
  };
}

export default function AboutPage() {
  return <AboutClient />;
}

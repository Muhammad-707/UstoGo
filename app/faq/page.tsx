import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import FaqClient from './FaqClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('faq');
  const title = t('title');
  const description = t('metaDescription');

  return {
    title,
    description,
    alternates: { canonical: '/faq' },
    openGraph: { title, description, url: '/faq' },
  };
}

async function FaqStructuredData() {
  const t = await getTranslations('faq');
  const json = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [1, 2, 3, 4].map((n) => ({
      '@type': 'Question',
      name: t(`q${n}`),
      acceptedAnswer: { '@type': 'Answer', text: t(`a${n}`) },
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}

export default function FaqPage() {
  return (
    <>
      <FaqStructuredData />
      <FaqClient />
    </>
  );
}

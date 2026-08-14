import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import FaqClient from './FaqClient';
import { FAQ_QUESTION_NUMBERS } from '@/lib/faq';

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
    // Driven by the same list the page renders — see `lib/faq.ts`. Two hand-kept copies
    // meant a question added on screen was quietly missing from what Google indexed.
    mainEntity: FAQ_QUESTION_NUMBERS.map((n) => ({
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

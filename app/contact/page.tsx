import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ContactClient from './ContactClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');
  const title = t('title');
  const description = t('metaDescription');

  return {
    title,
    description,
    alternates: { canonical: '/contact' },
    openGraph: { title, description, url: '/contact' },
  };
}

export default function ContactPage() {
  return <ContactClient />;
}

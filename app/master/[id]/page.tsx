import type { Metadata } from 'next';
import { mastersApi } from '@/lib/api/endpoints';
import { getAvatarUrl } from '@/lib/placeholders';
import MasterProfileClient from './MasterProfileClient';

type MasterPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: MasterPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const master = await mastersApi.byId(id);
    const title = `${master.displayName} — ${master.categories[0] ?? ''} in ${master.cityName}`.trim();
    const description =
      master.bio ??
      `${master.displayName} on UstoGo: ${master.categories.join(', ') || 'home services'} in ${master.cityName}. Rated ${master.ratingAverage} (${master.ratingCount} reviews).`;
    const image = master.avatarUrl ?? getAvatarUrl(master.id, master.displayName);

    return {
      title,
      description,
      alternates: { canonical: `/master/${id}` },
      openGraph: { title, description, url: `/master/${id}`, images: [{ url: image }] },
      twitter: { card: 'summary', title, description, images: [image] },
    };
  } catch {
    // A 404/network error here just falls back to the default title from the root
    // layout — MasterProfileClient renders the actual not-found UI for the visitor.
    return { alternates: { canonical: `/master/${id}` } };
  }
}

/** LocalBusiness structured data (§6.12) — the map/reviews/price signals search
 *  engines can actually surface as a rich result, at city-level granularity since
 *  that is the only address precision this schema collects. */
const buildStructuredData = async (id: string): Promise<string | null> => {
  try {
    const master = await mastersApi.byId(id);
    const json = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: master.displayName,
      image: master.avatarUrl ?? getAvatarUrl(master.id, master.displayName),
      description: master.bio ?? undefined,
      address: { '@type': 'PostalAddress', addressLocality: master.cityName, addressCountry: 'TJ' },
      ...(master.ratingCount > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: master.ratingAverage,
              reviewCount: master.ratingCount,
            },
          }
        : {}),
      ...(master.priceFrom !== null ? { priceRange: `From ${master.priceFrom}` } : {}),
    };

    return JSON.stringify(json);
  } catch {
    return null;
  }
};

export default async function MasterProfilePage({ params }: MasterPageProps) {
  const { id } = await params;
  const structuredData = await buildStructuredData(id);

  return (
    <>
      {structuredData !== null && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      )}
      <MasterProfileClient />
    </>
  );
}

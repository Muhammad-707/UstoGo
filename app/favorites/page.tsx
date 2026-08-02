'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { mastersApi } from '@/lib/api/endpoints';
import type { MasterPublic } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { useFavorites } from '@/hooks/useFavorites';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const { favoriteIds } = useFavorites();
  const [masters, setMasters] = useState<MasterPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setMasters([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(favoriteIds.map((id) => mastersApi.byId(id).catch(() => null)))
      .then((results) => {
        if (!cancelled) setMasters(results.filter((m): m is MasterPublic => m !== null));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [favoriteIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('badge')}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-slate-500 dark:text-slate-400 font-medium">
          Loading favorites...
        </div>
      ) : masters.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No favorites yet.</p>
          <Link href="/search" className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
            Browse masters
          </Link>
        </div>
      ) : (
        <FilterContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {masters.map((m, idx) => (
            <FilterItem key={m.id} index={idx % 3} className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-4">
                <img src={m.avatarUrl ?? getAvatarUrl(m.id)} alt={m.displayName} className="w-16 h-16 rounded-2xl object-cover" />
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{m.displayName}</h3>
                  <p className="text-xs text-blue-600 dark:text-sky-400 font-semibold">{m.cityName}</p>
                  <span className="text-xs text-amber-500 font-bold">★ {m.ratingAverage}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  {m.priceFrom ? t('hourlyRate', { rate: `$${m.priceFrom}` }) : '—'}
                </span>
                <Link
                  href={`/booking?master=${m.id}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                >
                  {t('bookService')}
                </Link>
              </div>
            </FilterItem>
          ))}
        </FilterContainer>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { favoritesApi } from '@/lib/api/endpoints';
import type { MasterPublic } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { useFavorites } from '@/hooks/useFavorites';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const { favoriteIds } = useFavorites();
  const [masters, setMasters] = useState<MasterPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // GET /favorites (unlike GET /masters/:id) does not filter by approval/active
    // status, so a favorited master who goes inactive or loses approval still shows
    // up here — with isActive/approvalStatus so the UI can explain why instead of
    // just silently dropping them.
    let cancelled = false;
    setLoading(true);
    favoritesApi
      .list()
      .then((items) => {
        if (!cancelled) setMasters(items);
      })
      .catch(() => {
        if (!cancelled) setMasters([]);
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
      <ClientPageHeader icon="heart" eyebrow={t('badge')} title={t('title')} />

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
          {masters.map((m, idx) => {
            const unavailable = m.approvalStatus !== 'APPROVED' || !m.isActive;
            return (
              <FilterItem key={m.id} index={idx % 3}>
              <motion.div
                whileHover={unavailable ? undefined : { y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`glass-card rounded-3xl p-6 border space-y-4 h-full ${
                  unavailable
                    ? 'border-slate-200 dark:border-slate-800 opacity-60'
                    : 'border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-sky-900 transition-[box-shadow,border-color] duration-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <img src={m.avatarUrl ?? getAvatarUrl(m.id, m.displayName)} alt={m.displayName} className="w-16 h-16 rounded-2xl object-cover" />
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{m.displayName}</h3>
                    <p className="text-xs text-blue-600 dark:text-sky-400 font-semibold">{m.cityName}</p>
                    <span className="text-xs text-amber-500 font-bold">★ {m.ratingAverage}</span>
                  </div>
                </div>
                {unavailable && (
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <Icon name="X" size={12} />
                    {m.approvalStatus !== 'APPROVED' ? t('unavailablePending') : t('unavailableInactive')}
                  </p>
                )}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {m.priceFrom ? t('hourlyRate', { rate: `$${m.priceFrom}` }) : '—'}
                  </span>
                  {unavailable ? (
                    <span className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold cursor-not-allowed">
                      {t('bookService')}
                    </span>
                  ) : (
                    <Link
                      href={`/booking?master=${m.id}`}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                    >
                      {t('bookService')}
                    </Link>
                  )}
                </div>
              </motion.div>
              </FilterItem>
            );
          })}
        </FilterContainer>
      )}
    </div>
  );
}

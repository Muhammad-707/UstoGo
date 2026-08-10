'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { citiesApi, mastersApi } from '@/lib/api/endpoints';
import type { City, LeaderboardBadge, LeaderboardEntry } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';

const BADGE_ICON: Record<LeaderboardBadge, string> = {
  TOP_RATED: 'star',
  MOST_BOOKED: 'trendingup',
  FAST_RESPONDER: 'zap',
  RISING_STAR: 'sparkles',
};

const BADGE_COLOR: Record<LeaderboardBadge, string> = {
  TOP_RATED: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  MOST_BOOKED: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  FAST_RESPONDER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  RISING_STAR: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300',
};

/** Gold, silver and bronze for the podium; everyone below gets the neutral chip. */
const RANK_MEDAL = [
  'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/30',
  'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-400/30',
  'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-500/30',
];

/**
 * The master leaderboard. Lived at `/leaderboard` until the header ran out of room —
 * it is a ranking of masters by rating, which is the same subject `/reviews` covers,
 * so the two share a page and the navbar carries one link instead of two.
 */
export function LeaderboardPanel() {
  const t = useTranslations('leaderboard');

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => setCities([]));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    mastersApi
      .leaderboard(cityId ? { cityId } : {})
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [cityId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches the leaderboard on mount/filter change
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('badge')}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('title')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">{t('subtitle')}</p>
        </div>

        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0"
        >
          <option value="">{t('allCities')}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-xs text-slate-400 font-semibold text-center py-8">{t('loading')}</p>}
      {!loading && entries.length === 0 && (
        <p className="text-xs text-slate-400 font-semibold text-center py-12">{t('empty')}</p>
      )}

      <div className="space-y-3">
        {entries.map((entry) => (
          <Link
            key={entry.master.id}
            href={`/master/${entry.master.id}`}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex items-center gap-4 hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-900 transition"
          >
            <div
              className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center font-extrabold text-sm shadow-lg ${
                RANK_MEDAL[entry.rank - 1] ??
                'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-none'
              }`}
            >
              {entry.rank}
            </div>
            <img
              src={entry.master.avatarUrl ?? getAvatarUrl(entry.master.id, entry.master.displayName)}
              alt={entry.master.displayName}
              className="w-14 h-14 rounded-2xl object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {entry.master.displayName}
              </h3>
              <p className="text-[11px] text-slate-400">{entry.master.cityName}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {entry.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${BADGE_COLOR[badge]}`}
                  >
                    <Icon name={BADGE_ICON[badge]} size={10} />
                    {t(`badgeLabel.${badge}`)}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-extrabold text-amber-500">★ {entry.master.ratingAverage}</span>
              <p className="text-[10px] text-slate-400">{t('reviewsCount', { count: entry.master.ratingCount })}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

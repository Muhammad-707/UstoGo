'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { bookingsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { ScheduleOptimizerResult } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { useDateFormat } from '@/lib/datetime';

export default function ScheduleOptimizerPage() {
  const t = useTranslations('scheduleOptimizer');
  const fmt = useDateFormat();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<ScheduleOptimizerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    bookingsApi
      .scheduleOptimizer(date)
      .then(setResult)
      .catch((err) => {
        setResult(null);
        setError(err instanceof ApiError ? err.message : t('loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [date, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches the optimized route on mount/date change
    load();
  }, [load]);

  return (
    <>
    <MasterPageHeader
      icon="compass"
      eyebrow={t('badge')}
      title={t('title')}
      hint={t('pageHint')}
      action={
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
        />
      }
    />
    <div className="page-shell page-shell-narrow py-10 space-y-8">

      {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}

      {result && !loading && (
        <>
          {result.stops.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center space-y-2">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('empty')}</p>
            </div>
          ) : (
            <>
              {result.estimatedSavingsKm > 0 && (
                <div className="glass-card rounded-3xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shrink-0">
                    <Icon name="trendingup" size={22} />
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                      {t('savingsAmount', { km: result.estimatedSavingsKm.toFixed(1) })}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t('savingsHint', {
                        optimized: result.totalDistanceKm.toFixed(1),
                        chronological: result.chronologicalDistanceKm.toFixed(1),
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {result.stops.map((stop, index) => (
                  <div key={stop.bookingId} className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                      {stop.order}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{stop.serviceTitle}</p>
                      <p className="text-[11px] text-slate-400">
                        {stop.district} · {fmt.time(stop.scheduledAt)}
                      </p>
                    </div>
                    {index < result.stops.length - 1 && <Icon name="arrowright" size={14} className="text-slate-300 shrink-0" />}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
    </>
  );
}

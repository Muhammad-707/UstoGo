'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, MapPin, Route, TrendingUp } from 'lucide-react';

import { bookingsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { ScheduleOptimizerResult } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageBody } from '@/components/layout/PageBody';
import { Panel } from '@/components/dashboard/Panel';
import { Notice } from '@/components/dashboard/Notice';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDateFormat } from '@/lib/datetime';
import { DatePicker, todayISO } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';

export default function ScheduleOptimizerPage() {
  const t = useTranslations('scheduleOptimizer');
  const fmt = useDateFormat();

  const [date, setDate] = useState(todayISO);
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
    /* Inside the shell, not beside it: the master sidebar links straight here, and
       without the shell the page dropped the reader out of their own cabinet with no
       way back but the browser's back button. */
    <DashboardShell role="MASTER">
      <MasterPageHeader
        icon="compass"
        eyebrow={t('badge')}
        title={t('title')}
        hint={t('pageHint')}
        action={
          <DatePicker
            value={date}
            onChange={setDate}
            aria-label={t('title')}
            className="w-auto min-w-52 rounded-xl p-3 font-bold"
          />
        }
      />

      <PageBody>
        {error && <Notice tone="danger">{error}</Notice>}

        {loading && (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        )}

        {result && !loading && result.stops.length === 0 && (
          <EmptyState icon="compass" tone="blue" title={t('empty')} />
        )}

        {result && !loading && result.stops.length > 0 && (
          <>
            {result.estimatedSavingsKm > 0 && (
              <Notice tone="success" Icon={TrendingUp} title={t('savingsAmount', { km: result.estimatedSavingsKm.toFixed(1) })}>
                {t('savingsHint', {
                  optimized: result.totalDistanceKm.toFixed(1),
                  chronological: result.chronologicalDistanceKm.toFixed(1),
                })}
              </Notice>
            )}

            <Panel
              title={t('stopsTitle')}
              Icon={Route}
              accent="blue"
              divided
              padding="none"
              action={
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {result.stops.length}
                </span>
              }
            >
              <ol className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.stops.map((stop, index) => (
                  <li
                    key={stop.bookingId}
                    className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-slate-50/70 sm:px-6 dark:hover:bg-slate-800/30"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-extrabold text-white tabular-nums">
                      {stop.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                        {stop.serviceTitle}
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        {stop.district} · {fmt.time(stop.scheduledAt)}
                      </p>
                    </div>
                    {index < result.stops.length - 1 && (
                      <ArrowRight size={14} className="shrink-0 text-slate-300 dark:text-slate-600" />
                    )}
                  </li>
                ))}
              </ol>
            </Panel>
          </>
        )}
      </PageBody>
    </DashboardShell>
  );
}

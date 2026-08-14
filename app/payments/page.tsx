'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CircleCheckBig, Info, Receipt, Users, Wallet } from 'lucide-react';

import { useMoney } from '@/lib/money';
import { bookingsApi } from '@/lib/api/endpoints';
import type { Booking } from '@/lib/api/types';
import { useDateFormat } from '@/lib/datetime';

import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { MetricGrid, type Metric } from '@/components/dashboard/MetricCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsPage() {
  const t = useTranslations('payments');
  const fmt = useDateFormat();
  const { money } = useMoney();
  const [completed, setCompleted] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi
      .list({ status: 'COMPLETED', limit: 50 })
      .then((res) => setCompleted(res.items))
      .catch(() => setCompleted([]))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const spent = completed.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    return {
      spent,
      count: completed.length,
      average: completed.length > 0 ? spent / completed.length : 0,
      masters: new Set(completed.map((b) => b.masterId)).size,
    };
  }, [completed]);

  const metrics: Metric[] = [
    { label: t('totalSpentLabel'), value: money(totals.spent), Icon: Wallet, tone: 'blue' },
    { label: t('completedCount', { count: totals.count }), value: totals.count, Icon: CircleCheckBig, tone: 'emerald' },
    { label: t('statAverage'), value: money(totals.average), Icon: Receipt, tone: 'amber' },
    { label: t('statMasters'), value: totals.masters, Icon: Users, tone: 'violet' },
  ];

  return (
    <>
      <ClientPageHeader icon="dollarsign" eyebrow={t('badge')} title={t('title')} />

      <div className="page-shell space-y-8 py-10">

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[148px] rounded-[1.5rem]" />
            ))}
          </div>
        ) : (
          <MetricGrid metrics={metrics} />
        )}

        {/* The one thing a payments page has to be honest about: nothing is charged
            here. Stated once, next to the figures, rather than buried under them. */}
        <div className="flex items-start gap-3 rounded-3xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
          <Info size={16} className="mt-0.5 shrink-0 text-blue-600 dark:text-sky-400" />
          <p className="text-xs leading-relaxed text-blue-900 dark:text-sky-200">{t('payDirectlyNotice')}</p>
        </div>

        <section className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('transactionsTitle')}</h3>

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-3xl" />
              ))}
            </div>
          )}

          {!loading && completed.length === 0 && (
            <EmptyState
              icon="dollarsign"
              title={t('noTransactions')}
              description={t('noTransactionsDesc')}
              actionLabel={t('findMaster')}
              actionHref="/search"
            />
          )}

          {!loading && completed.length > 0 && (
            <FilterContainer className="space-y-3">
              {completed.map((b, idx) => (
                <FilterItem key={b.id} index={idx}>
                  <Link
                    href={`/booking/${b.id}`}
                    className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <CircleCheckBig size={19} strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                          {b.serviceTitle}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {b.masterDisplayName}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          {b.bookingNumber} · {b.completedAt ? fmt.date(b.completedAt) : '—'}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-base font-extrabold text-slate-900 tabular-nums dark:text-white">
                      {money(b.price)}
                    </span>
                  </Link>
                </FilterItem>
              ))}
            </FilterContainer>
          )}
        </section>
      </div>
    </>
  );
}

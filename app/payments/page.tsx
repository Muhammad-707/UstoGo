'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CircleCheckBig, Info, Receipt, Users, Wallet } from 'lucide-react';

import { useMoney } from '@/lib/money';
import { bookingsApi } from '@/lib/api/endpoints';
import type { Booking } from '@/lib/api/types';
import { useDateFormat } from '@/lib/datetime';

import { CabinetPage } from '@/components/layout/CabinetPage';
import { MetricGrid, type Metric } from '@/components/dashboard/MetricCard';
import { Notice } from '@/components/dashboard/Notice';
import { Panel } from '@/components/dashboard/Panel';
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
    <CabinetPage icon="dollarsign" eyebrow={t('badge')} title={t('title')}>
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <MetricGrid metrics={metrics} />
      )}

      {/* The one thing a payments page has to be honest about: nothing is charged
          here. Stated once, next to the figures, rather than buried under them. */}
      <Notice tone="info" Icon={Info}>
        {t('payDirectlyNotice')}
      </Notice>

      <Panel
        Icon={Receipt}
        accent="emerald"
        title={t('transactionsTitle')}
        padding="none"
        divided
        action={
          completed.length > 0 ? (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {completed.length}
            </span>
          ) : undefined
        }
      >
        {loading && (
          <div className="space-y-2.5 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && completed.length === 0 && (
          <EmptyState
            variant="inline"
            icon="dollarsign"
            title={t('noTransactions')}
            description={t('noTransactionsDesc')}
            actionLabel={t('findMaster')}
            actionHref="/search"
          />
        )}

        {!loading && completed.length > 0 && (
          <FilterContainer className="divide-y divide-slate-100 dark:divide-slate-800">
            {completed.map((b, idx) => (
              <FilterItem key={b.id} index={idx}>
                <Link
                  href={`/booking/${b.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                      <CircleCheckBig size={17} strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-extrabold text-slate-900 dark:text-white">
                        {b.serviceTitle}
                      </p>
                      <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {b.masterDisplayName} · {b.completedAt ? fmt.date(b.completedAt) : '—'}
                      </p>
                      <p className="truncate font-mono text-[10px] text-slate-400">{b.bookingNumber}</p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-extrabold text-slate-900 tabular-nums dark:text-white">
                    {money(b.price)}
                  </span>
                </Link>
              </FilterItem>
            ))}
          </FilterContainer>
        )}
      </Panel>
    </CabinetPage>
  );
}

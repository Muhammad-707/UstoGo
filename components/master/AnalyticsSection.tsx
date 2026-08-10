'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import type { MasterStats } from '@/lib/api/types';
import { useMoney } from '@/lib/money';

/** `labelKey` resolves against `dashboardMaster` — this whole section shipped with its
    labels hardcoded in Russian, so a Tajik or English master read the wrong language. */
const STATUS_ROWS: { key: keyof MasterStats; labelKey: string; color: string }[] = [
  { key: 'completedCount', labelKey: 'statusCompleted', color: 'bg-emerald-500' },
  { key: 'acceptedCount', labelKey: 'statusInProgress', color: 'bg-blue-500' },
  { key: 'pendingCount', labelKey: 'statusAwaiting', color: 'bg-amber-500' },
  { key: 'cancelledCount', labelKey: 'statusCancelledShort', color: 'bg-rose-500' },
];

function EarningsBarChart({ stats }: { stats: MasterStats }) {
  const { money } = useMoney();
  const values = stats.dailyEarnings.map((d) => Number(d.total));
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-1.5 h-40">
      {stats.dailyEarnings.map((d, i) => {
        const heightPct = Math.max((Number(d.total) / max) * 100, Number(d.total) > 0 ? 6 : 2);
        const date = new Date(`${d.date}T00:00:00Z`);
        const isToday = i === stats.dailyEarnings.length - 1;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
            <div className="w-full h-32 flex items-end">
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-md transition-all ${
                  isToday
                    ? 'bg-gradient-to-t from-amber-500 to-orange-400'
                    : 'bg-gradient-to-t from-amber-500/40 to-orange-400/40 group-hover:from-amber-500 group-hover:to-orange-400'
                }`}
              />
            </div>
            <span className="text-[9px] font-bold text-slate-400">
              {date.toLocaleDateString(undefined, { day: 'numeric' })}
            </span>
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
              {money(d.total)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompletionRing({ rate }: { rate: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(rate, 100) / 100) * circumference;

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28">
      <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-slate-800" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        className="stroke-emerald-500 transition-all duration-700"
      />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        className="fill-slate-900 dark:fill-white font-extrabold"
        style={{ fontSize: '20px' }}
      >
        {rate.toFixed(0)}%
      </text>
    </svg>
  );
}

function StatTile({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl flex items-center gap-4">
      <div className={`w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">{label}</span>
        <p className="text-lg font-extrabold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export function AnalyticsSection({ stats, loading }: { stats: MasterStats | null; loading: boolean }) {
  const t = useTranslations('dashboardMaster');
  const { money } = useMoney();

  return (
    <div>
      <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <Icon name="barchart3" size={16} className="text-amber-500" />
        {t('analyticsTitle')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile
          icon="clock"
          label={t('responseSpeed')}
          value={loading || !stats || stats.avgAcceptLatencyMinutes === null ? '—' : t('minutesShort', { minutes: stats.avgAcceptLatencyMinutes })}
          color="from-blue-500 to-indigo-500"
        />
        <StatTile
          icon="users"
          label={t('repeatClients')}
          value={loading || !stats ? '—' : `${stats.repeatClientRate}%`}
          color="from-violet-500 to-purple-500"
        />
        <StatTile
          icon="eye"
          label={t('profileViews')}
          value={loading || !stats ? '—' : String(stats.profileViews)}
          color="from-emerald-500 to-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('revenue14Days')}
              </span>
              <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {loading || !stats ? '—' : money(stats.totalEarnings)}
                <span className="text-xs font-bold text-slate-400 ml-1">{t('totalWord')}</span>
              </h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md">
              <Icon name="trendingup" size={20} />
            </div>
          </div>
          {loading || !stats ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-semibold">
              {t('loadingShort')}
            </div>
          ) : (
            <EarningsBarChart stats={stats} />
          )}
        </div>

        {/* Status breakdown + completion rate */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 self-start mb-2">
            {t('completionRateTitle')}
          </span>
          {loading || !stats ? (
            <div className="h-28 flex items-center justify-center text-xs text-slate-400 font-semibold">
              {t('loadingShort')}
            </div>
          ) : (
            <CompletionRing rate={stats.completionRate} />
          )}
          <div className="w-full mt-6 space-y-2.5">
            {STATUS_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${row.color}`} />
                  {t(row.labelKey)}
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {loading || !stats ? '—' : (stats[row.key] as number)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!loading && stats && stats.earningsByCategory.length > 0 && (
        <div className="mt-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-4">
            {t('revenueByCategory')}
          </span>
          <div className="space-y-3">
            {(() => {
              const max = Math.max(...stats.earningsByCategory.map((c) => Number(c.total)), 1);
              return stats.earningsByCategory.map((c) => (
                <div key={c.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{c.categoryName}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {money(c.total)} <span className="text-slate-400 font-semibold">({c.completedCount})</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      style={{ width: `${(Number(c.total) / max) * 100}%` }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

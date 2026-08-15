'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Bar, BarChart, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts';
import {
  BarChart3,
  Clock,
  Eye,
  Gauge,
  Heart,
  Layers,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { AccentIcon, type AccentTone } from '@/components/dashboard/AccentIcon';
import { PANEL_SURFACE, Panel } from '@/components/dashboard/Panel';
import { SectionHeading } from '@/components/dashboard/SectionHeading';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { MasterNps, MasterStats } from '@/lib/api/types';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

/** `labelKey` resolves against `dashboardMaster` — this whole section shipped with its
    labels hardcoded in Russian, so a Tajik or English master read the wrong language. */
const STATUS_ROWS: { key: keyof MasterStats; labelKey: string; color: string; dot: string }[] = [
  { key: 'completedCount', labelKey: 'statusCompleted', color: 'var(--chart-3)', dot: 'bg-emerald-500' },
  { key: 'acceptedCount', labelKey: 'statusInProgress', color: 'var(--chart-1)', dot: 'bg-blue-500' },
  { key: 'pendingCount', labelKey: 'statusAwaiting', color: 'var(--chart-4)', dot: 'bg-amber-500' },
  { key: 'cancelledCount', labelKey: 'statusCancelledShort', color: 'var(--destructive)', dot: 'bg-rose-500' },
];

/** A placeholder the exact height of the chart it stands in for, so the panel does not
    jump a hundred pixels the moment the fetch lands. */
function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('w-full rounded-2xl', className)} />;
}

/**
 * The four booking outcomes as a donut, with the completion rate in the middle.
 *
 * The ring it replaces drew a single arc and left the four counts beside it as dead
 * text — the numbers were there, but nothing connected a number to the shape. Every
 * slice is now hoverable and the legend rows carry the same colours the chart does.
 */
function CompletionDonut({ stats }: { stats: MasterStats }) {
  const t = useTranslations('dashboardMaster');

  const config: ChartConfig = Object.fromEntries(
    STATUS_ROWS.map((row) => [row.labelKey, { label: t(row.labelKey), color: row.color }]),
  );

  const data = STATUS_ROWS.map((row) => ({
    name: t(row.labelKey),
    key: row.labelKey,
    value: stats[row.key] as number,
    fill: row.color,
  })).filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
      <ChartContainer config={config} className="aspect-square h-40 w-40 shrink-0">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={2} strokeWidth={0}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.fill} className="transition-opacity hover:opacity-80" />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !('cx' in viewBox)) return null;
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-[24px] font-extrabold tabular-nums"
                    >
                      {stats.completionRate.toFixed(0)}%
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="min-w-0 flex-1 space-y-2 self-stretch sm:self-center">
        {STATUS_ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.06]"
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', row.dot)} />
              <span className="truncate">{t(row.labelKey)}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-white">
              {stats[row.key] as number}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The colours the category rows cycle through, in the order the trades rank. */
const CATEGORY_INK = [
  { ring: 'stroke-blue-500', text: 'text-blue-600 dark:text-blue-300' },
  { ring: 'stroke-violet-500', text: 'text-violet-600 dark:text-violet-300' },
  { ring: 'stroke-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' },
  { ring: 'stroke-amber-500', text: 'text-amber-600 dark:text-amber-300' },
  { ring: 'stroke-cyan-500', text: 'text-cyan-600 dark:text-cyan-300' },
  { ring: 'stroke-rose-500', text: 'text-rose-600 dark:text-rose-300' },
];

/** One trade's share of the fortnight, as an arc with the figure inside it. */
function ShareRing({ percent, ink }: { percent: number; ink: (typeof CATEGORY_INK)[number] }) {
  const radius = 15.5;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(Math.max(percent, 0), 100) / 100) * circumference;

  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          className="stroke-slate-900/[0.08] dark:stroke-white/10"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${filled.toFixed(2)} ${circumference.toFixed(2)}`}
          className={cn('transition-[stroke-dasharray] duration-700 ease-out', ink.ring)}
        />
      </svg>
      <span className={cn('relative text-[10px] font-extrabold tabular-nums', ink.text)}>
        {Math.round(percent)}%
      </span>
    </span>
  );
}

/**
 * Takings per trade, as a ranked list of share rings.
 *
 * Two earlier attempts got this wrong in the same way. A recharts `BarChart`, and then a
 * hand-rolled progress bar, both drew a full-width horizontal rule for a master with one
 * category — which is most masters — so the panel's entire content was one straight blue
 * line that said nothing, since a single category is always 100% of itself. A ring reads
 * as a proportion at any count: full for one trade, split for six, and the figure is
 * printed inside it either way instead of being left for the eye to measure.
 */
function CategoryList({ stats }: { stats: MasterStats }) {
  const t = useTranslations('dashboardMaster');
  const { money } = useMoney();

  const rows = stats.earningsByCategory
    .map((c) => ({ name: c.categoryName, total: Number(c.total) || 0, count: c.completedCount }))
    .sort((a, b) => b.total - a.total);

  const sum = rows.reduce((acc, r) => acc + r.total, 0);

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {rows.map((row, i) => {
        const ink = CATEGORY_INK[i % CATEGORY_INK.length];
        return (
          <div key={row.name} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
            <ShareRing percent={sum > 0 ? (row.total / sum) * 100 : 0} ink={ink} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">{row.name}</p>
              <p className="truncate text-[11.5px] font-medium text-slate-400 dark:text-slate-500">
                {t('metricJobsCompletedValue', { count: row.count })}
              </p>
            </div>

            <span className="shrink-0 text-[14px] font-extrabold tabular-nums tracking-[-0.01em] text-slate-900 dark:text-white">
              {money(row.total)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Promoters / passives / detractors as one stacked bar — the shape of the answer. */
function NpsBar({ nps }: { nps: MasterNps }) {
  const t = useTranslations('dashboardMaster');

  const config = {
    promoters: { label: t('npsPromoters'), color: 'var(--chart-3)' },
    passives: { label: t('npsPassives'), color: 'var(--chart-2)' },
    detractors: { label: t('npsDetractors'), color: 'var(--destructive)' },
  } satisfies ChartConfig;

  const data = [
    { band: 'nps', promoters: nps.promoters, passives: nps.passives, detractors: nps.detractors },
  ];

  return (
    <ChartContainer config={config} className="aspect-auto h-9 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0, top: 2, bottom: 2 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="band" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="promoters" stackId="a" fill="var(--color-promoters)" radius={[6, 0, 0, 6]} barSize={18} />
        <Bar dataKey="passives" stackId="a" fill="var(--color-passives)" barSize={18} />
        <Bar dataKey="detractors" stackId="a" fill="var(--color-detractors)" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ChartContainer>
  );
}

/** A supporting figure. Carries the same tinted glyph tile the metric row and every
    panel header use, so the analytics band reads as part of the same product rather
    than as a grey footer bolted under it. */
function StatTile({
  Icon,
  label,
  value,
  tone,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  tone: AccentTone;
}) {
  return (
    <div className={cn(PANEL_SURFACE, 'group flex items-center gap-3.5 px-5 py-4')}>
      <AccentIcon Icon={Icon} tone={tone} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-[20px] font-semibold leading-tight tracking-[-0.025em] text-slate-900 tabular-nums dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

export function AnalyticsSection({
  stats,
  loading,
  nps,
}: {
  stats: MasterStats | null;
  loading: boolean;
  nps?: MasterNps | null;
}) {
  const t = useTranslations('dashboardMaster');
  const npsTotal = nps ? nps.promoters + nps.passives + nps.detractors : 0;

  return (
    <section className="space-y-5">
      <SectionHeading
        accent="violet"
        EyebrowIcon={BarChart3}
        eyebrow={t('analyticsEyebrow')}
        title={t('analyticsTitle')}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile
          Icon={Clock}
          tone="blue"
          label={t('responseSpeed')}
          value={
            loading || !stats || stats.avgAcceptLatencyMinutes === null
              ? '—'
              : t('minutesShort', { minutes: stats.avgAcceptLatencyMinutes })
          }
        />
        <StatTile
          Icon={Users}
          tone="violet"
          label={t('repeatClients')}
          value={loading || !stats ? '—' : `${stats.repeatClientRate}%`}
        />
        <StatTile
          Icon={Eye}
          tone="emerald"
          label={t('profileViews')}
          value={loading || !stats ? '—' : String(stats.profileViews)}
        />
      </div>

      {/* The breakdown you come down the page to read. The fourteen-day revenue chart
          itself is *not* repeated here: the spotlight at the top of the page now carries
          a full one — dated axis, marked best day, a value on every point — and two
          copies of the same fourteen days on one screen is not twice the insight, it is
          the same insight twice. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Category takings and NPS stack in one column beside the donut. NPS on its own
            full-width row was a 1300px card holding one sentence; here it closes the
            column the breakdown starts, and the two columns end level. */}
        <div className="space-y-4 lg:col-span-7">
          <Panel Icon={Layers} accent="violet" title={t('revenueByCategory')} divided>
            {loading || !stats ? (
              <ChartSkeleton className="h-32" />
            ) : stats.earningsByCategory.length === 0 ? (
              <p className="text-[12.5px] font-medium text-slate-400">{t('npsNoData')}</p>
            ) : (
              <CategoryList stats={stats} />
            )}
          </Panel>

          <Panel Icon={Heart} accent="rose" title={t('myNpsTitle')} description={t('myNpsSubtitle')} divided>
            {!nps || nps.responseCount === 0 ? (
              <p className="text-[12.5px] font-medium text-slate-400">{t('npsNoData')}</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-extrabold leading-none tracking-[-0.035em] text-slate-900 tabular-nums dark:text-white">
                    {nps.nps ?? '—'}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-400">NPS</span>
                </div>

                <NpsBar nps={nps} />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px]">
                  {[
                    { label: t('npsPromoters'), count: nps.promoters, dot: 'bg-emerald-500' },
                    { label: t('npsPassives'), count: nps.passives, dot: 'bg-sky-400' },
                    { label: t('npsDetractors'), count: nps.detractors, dot: 'bg-rose-500' },
                  ].map((row) => (
                    <span key={row.label} className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className={cn('h-2 w-2 rounded-full', row.dot)} />
                      {row.label}
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {row.count}
                        <span className="ml-0.5 font-normal text-slate-400">
                          ({npsTotal > 0 ? Math.round((row.count / npsTotal) * 100) : 0}%)
                        </span>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Panel>
        </div>

        <Panel className="lg:col-span-5" Icon={Gauge} accent="emerald" title={t('completionRateTitle')} divided>
          {loading || !stats ? <ChartSkeleton className="h-40" /> : <CompletionDonut stats={stats} />}
        </Panel>
      </div>
    </section>
  );
}

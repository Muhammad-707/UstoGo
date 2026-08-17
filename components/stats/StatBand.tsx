'use client';

import React from 'react';
import { CircleCheckBig, ShieldCheck, ShieldPlus, Star, type LucideIcon } from 'lucide-react';

import { CountUp } from '@/components/stats/CountUp';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { cn } from '@/lib/utils';

export type StatTone = 'blue' | 'emerald' | 'amber' | 'violet';

const TONE: Record<StatTone, string> = {
  blue: 'text-blue-600 dark:text-sky-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  violet: 'text-violet-600 dark:text-violet-400',
};

export interface StatItem {
  /** The figure itself, as a number so it can be counted up to. */
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  Icon: LucideIcon;
  tone: StatTone;
}

/**
 * The four headline numbers, as one quiet row.
 *
 * No card, no border, no shadow, no rail. This started as four tinted panels and grew
 * an icon tile, a corner bloom and a progress bar per figure — decoration that made
 * four small facts look like the most important thing on the page. All that is left is
 * a hairline between the columns; the figure counts up from zero when it scrolls into
 * view, and that is the whole effect.
 *
 * Landing and /about only. The signed-in feed has its own work to do.
 */
export function StatBand({ items, className }: { items: readonly StatItem[]; className?: string }) {
  return (
    <FilterContainer
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-8 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-200/80 dark:lg:divide-slate-800',
        className
      )}
    >
      {items.map((s) => (
        <FilterItem key={s.label} className="lg:px-8 lg:first:pl-0 lg:last:pr-0">
          <s.Icon size={18} strokeWidth={2.2} className={TONE[s.tone]} />

          <div className="mt-2.5 text-2xl font-extrabold leading-none tracking-tight text-slate-900 tabular-nums sm:mt-3 sm:text-4xl dark:text-white">
            <CountUp to={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
          </div>

          <p className="mt-1.5 text-[10px] font-semibold uppercase leading-snug tracking-[0.1em] text-slate-500 sm:mt-2 sm:text-[11px] sm:tracking-[0.12em] dark:text-slate-400">
            {s.label}
          </p>
        </FilterItem>
      ))}
    </FilterContainer>
  );
}

/**
 * The four headline figures themselves, defined once. `labelKey` resolves against the
 * `common` namespace — the landing page and /about both showed these numbers and had
 * drifted into two different card designs for the same four facts.
 */
export const SITE_STAT_DEFS = [
  { value: 50000, suffix: '+', labelKey: 'completedJobs', Icon: CircleCheckBig, tone: 'blue' },
  { value: 1420, suffix: '+', labelKey: 'verifiedMasters', Icon: ShieldCheck, tone: 'emerald' },
  { value: 4.95, decimals: 2, suffix: ' / 5', labelKey: 'avgRating', Icon: Star, tone: 'amber' },
  { value: 100, suffix: '%', labelKey: 'insuranceGuarantee', Icon: ShieldPlus, tone: 'violet' },
] as const satisfies readonly (Omit<StatItem, 'label'> & { labelKey: string })[];

export default StatBand;

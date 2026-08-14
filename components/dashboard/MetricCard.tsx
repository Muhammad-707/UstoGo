'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';

import { CountUp } from '@/components/stats/CountUp';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { cn } from '@/lib/utils';

export type MetricTone = 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';

const TONE: Record<MetricTone, { tile: string; wash: string }> = {
  blue: { tile: 'from-blue-600 to-sky-500 shadow-blue-500/25', wash: 'bg-blue-500/15' },
  emerald: { tile: 'from-emerald-600 to-teal-500 shadow-emerald-500/25', wash: 'bg-emerald-500/15' },
  amber: { tile: 'from-amber-500 to-orange-500 shadow-amber-500/25', wash: 'bg-amber-500/15' },
  violet: { tile: 'from-violet-600 to-fuchsia-500 shadow-violet-500/25', wash: 'bg-violet-500/15' },
  rose: { tile: 'from-rose-500 to-pink-500 shadow-rose-500/25', wash: 'bg-rose-500/15' },
  slate: { tile: 'from-slate-700 to-slate-500 shadow-slate-500/25', wash: 'bg-slate-500/15' },
};

export interface Metric {
  label: string;
  /** A plain number counts up; pass a string when the figure is already formatted. */
  value: number | string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  Icon: LucideIcon;
  tone: MetricTone;
  /** Turns the whole tile into a link to the screen the figure came from. */
  href?: string;
  /** Small caption under the figure — a target, a delta, a breakdown. */
  hint?: string;
}

function MetricBody({ metric }: { metric: Metric }) {
  const tone = TONE[metric.tone];
  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-90',
          tone.wash
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-1 ring-white/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110',
            tone.tile
          )}
        >
          <metric.Icon size={19} strokeWidth={2.2} />
        </span>
        {metric.href && (
          <ArrowUpRight
            size={16}
            className="translate-y-1 text-slate-300 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 dark:text-slate-600"
          />
        )}
      </div>

      <div className="relative mt-5 text-3xl font-extrabold leading-none tracking-tight text-slate-900 tabular-nums dark:text-white">
        {typeof metric.value === 'number' ? (
          <CountUp
            to={metric.value}
            decimals={metric.decimals}
            prefix={metric.prefix}
            suffix={metric.suffix}
            duration={1.2}
          />
        ) : (
          <span className="break-words">{metric.value}</span>
        )}
      </div>

      <p className="relative mt-2 text-[11px] font-bold uppercase leading-snug tracking-[0.1em] text-slate-400">
        {metric.label}
      </p>

      {metric.hint && (
        <p className="relative mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{metric.hint}</p>
      )}
    </>
  );
}

const CARD_CLASS =
  'group relative h-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)] transition-shadow duration-300 hover:shadow-[0_28px_56px_-28px_rgba(15,23,42,0.3)] sm:p-6 dark:border-slate-800 dark:bg-slate-900';

/**
 * One headline figure on a dashboard.
 *
 * All three dashboards had grown their own version of this tile — the client's put the
 * icon on the right and the label above the number, the master's put it on the left,
 * the admin's used a different radius — so the same product looked like three products
 * depending on who signed in. One component, one shape, and the figure counts up so the
 * number is the thing that moves rather than the decoration around it.
 */
export function MetricCard({ metric }: { metric: Metric }) {
  if (metric.href) {
    return (
      <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }} className="h-full">
        <Link href={metric.href} className={cn(CARD_CLASS, 'block hover:border-blue-200 dark:hover:border-sky-900/80')}>
          <MetricBody metric={metric} />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={CARD_CLASS}
    >
      <MetricBody metric={metric} />
    </motion.div>
  );
}

/** The row of them, with the stagger the rest of the product uses. */
export function MetricGrid({ metrics, className }: { metrics: Metric[]; className?: string }) {
  return (
    <FilterContainer className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {metrics.map((m) => (
        <FilterItem key={m.label} className="h-full">
          <MetricCard metric={m} />
        </FilterItem>
      ))}
    </FilterContainer>
  );
}

export default MetricCard;

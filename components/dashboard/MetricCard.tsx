'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';

import { CountUp } from '@/components/stats/CountUp';
import { AccentIcon, type AccentTone } from '@/components/dashboard/AccentIcon';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { cn } from '@/lib/utils';

export type MetricTone = 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';

/** Border and shadow the card takes on when the pointer is over it. */
const HOVER: Record<MetricTone, string> = {
  blue: 'hover:border-blue-200 hover:shadow-[0_14px_30px_-18px_rgba(37,99,235,0.5)] dark:hover:border-sky-900',
  emerald: 'hover:border-emerald-200 hover:shadow-[0_14px_30px_-18px_rgba(16,185,129,0.5)] dark:hover:border-emerald-900',
  amber: 'hover:border-amber-200 hover:shadow-[0_14px_30px_-18px_rgba(245,158,11,0.5)] dark:hover:border-amber-900',
  violet: 'hover:border-violet-200 hover:shadow-[0_14px_30px_-18px_rgba(139,92,246,0.5)] dark:hover:border-violet-900',
  rose: 'hover:border-rose-200 hover:shadow-[0_14px_30px_-18px_rgba(244,63,94,0.5)] dark:hover:border-rose-900',
  slate: 'hover:border-slate-300 hover:shadow-[0_14px_30px_-18px_rgba(15,23,42,0.5)] dark:hover:border-slate-700',
};

const GLYPH: Record<MetricTone, AccentTone> = {
  blue: 'blue',
  emerald: 'emerald',
  amber: 'amber',
  violet: 'violet',
  rose: 'rose',
  slate: 'slate',
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
  return (
    <>
      <AccentIcon Icon={metric.Icon} tone={GLYPH[metric.tone]} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
        <p className="text-[21px] font-bold leading-tight tracking-[-0.03em] text-slate-900 tabular-nums dark:text-white">
          {typeof metric.value === 'number' ? (
            <CountUp
              to={metric.value}
              decimals={metric.decimals}
              prefix={metric.prefix}
              suffix={metric.suffix}
              duration={1.2}
            />
          ) : (
            metric.value
          )}
        </p>
        {metric.hint && (
          <p className="truncate text-[11.5px] leading-snug text-slate-400 dark:text-slate-500">{metric.hint}</p>
        )}
      </div>

      {metric.href && (
        <ArrowUpRight
          size={15}
          strokeWidth={2.4}
          className="mt-0.5 shrink-0 self-start text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-700 dark:group-hover:text-slate-400"
        />
      )}
    </>
  );
}

/**
 * One supporting figure on a dashboard.
 *
 * It is a *row*, not a poster: a glyph, a caption and a number, about 76px tall. Three
 * earlier versions of this card put a 38–44px figure under a 48px icon tile with a
 * coloured wash bleeding across the corner, and four of them ate the whole top of the
 * screen before the reader reached anything they came for. These are the numbers you
 * glance at; the earnings spotlight below them is the one that gets to be loud.
 *
 * All three dashboards share it, so the same product looks like one product whoever
 * signs in.
 */
const CARD_CLASS =
  'group flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[box-shadow,border-color] duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none';

export function MetricCard({ metric }: { metric: Metric }) {
  if (metric.href) {
    return (
      <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }} className="h-full">
        <Link href={metric.href} className={cn(CARD_CLASS, HOVER[metric.tone])}>
          <MetricBody metric={metric} />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className={cn(CARD_CLASS, HOVER[metric.tone])}
    >
      <MetricBody metric={metric} />
    </motion.div>
  );
}

/** The row of them, with the stagger the rest of the product uses. */
export function MetricGrid({ metrics, className }: { metrics: Metric[]; className?: string }) {
  return (
    <FilterContainer className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {metrics.map((m) => (
        <FilterItem key={m.label} className="h-full">
          <MetricCard metric={m} />
        </FilterItem>
      ))}
    </FilterContainer>
  );
}

export default MetricCard;

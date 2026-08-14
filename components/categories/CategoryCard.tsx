'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck } from 'lucide-react';

import type { Category } from '@/lib/api/types';
import { getCategoryVisual } from '@/lib/categoryVisuals';
import { cn } from '@/lib/utils';

export interface CategoryCardProps {
  category: Category;
  /** How many verified masters cover this category. */
  mastersCount: number;
  /** Cheapest hourly rate across those masters, already formatted. */
  priceLabel?: string | null;
  mastersLabel: string;
  /** `compact` is the 5-across landing row; `feature` is the 3-across directory grid. */
  variant?: 'compact' | 'feature';
  /** Ribbon in the photo's top-left corner — "Most popular", "Premium". */
  tag?: { label: string; className: string } | null;
}

/**
 * One category, as a card with a photograph of the trade.
 *
 * The previous version was a flat tile with an oversized ghost glyph washed into the
 * corner at 3% opacity plus a colour gradient that pulsed on a loop — twenty of them
 * on one page read as twenty coloured rectangles, and nothing on the card said what
 * the trade actually looks like. A real photo does that work in one glance, so the
 * artwork leads and the icon shrinks to a chip that keeps the colour coding.
 */
export function CategoryCard({
  category,
  mastersCount,
  priceLabel,
  mastersLabel,
  variant = 'feature',
  tag,
}: CategoryCardProps) {
  const visual = getCategoryVisual(category.slug);
  const { Icon } = visual;
  const compact = variant === 'compact';

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="h-full"
    >
      <Link
        href={`/search?category=${category.id}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-blue-200 hover:shadow-[0_24px_48px_-24px_rgba(37,99,235,0.35)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-900/80 dark:hover:shadow-[0_24px_48px_-24px_rgba(56,189,248,0.25)]"
      >
        {/* Photo */}
        <div className={cn('relative overflow-hidden', compact ? 'h-32' : 'h-44')}>
          <img
            src={visual.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
          />
          {/* Legibility wash — the pills below sit on top of arbitrary photography. */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-slate-950/25" />

          {tag && (
            <span
              className={cn(
                'absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm backdrop-blur-md',
                tag.className
              )}
            >
              {tag.label}
            </span>
          )}

          <span className="absolute right-3 top-3 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-white/95 text-slate-700 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 dark:bg-slate-800/95 dark:text-white">
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </span>

          {priceLabel && (
            <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-slate-900 shadow-lg backdrop-blur-md dark:bg-slate-900/90 dark:text-white">
              {priceLabel}
            </span>
          )}
        </div>

        {/* Icon chip, straddling the photo edge */}
        <div className="relative px-5">
          <div
            className={cn(
              'absolute -top-6 flex items-center justify-center rounded-2xl border-4 border-white shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 dark:border-slate-900',
              visual.tile,
              compact ? 'h-11 w-11' : 'h-12 w-12'
            )}
          >
            <Icon size={compact ? 18 : 20} strokeWidth={2.2} />
          </div>
        </div>

        {/* Copy */}
        <div className={cn('flex flex-1 flex-col px-5 pb-5', compact ? 'pt-8' : 'pt-9')}>
          <h3
            className={cn(
              'font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-sky-400',
              compact ? 'text-sm' : 'text-lg'
            )}
          >
            {category.name}
          </h3>

          {category.description && (
            <p
              className={cn(
                'mt-1.5 leading-relaxed text-slate-500 dark:text-slate-400',
                compact ? 'line-clamp-2 text-[11px]' : 'line-clamp-2 text-xs'
              )}
            >
              {category.description}
            </p>
          )}

          <div className="mt-auto flex items-center gap-1.5 pt-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <BadgeCheck
              size={14}
              className={mastersCount > 0 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}
            />
            <span>{mastersLabel}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default CategoryCard;

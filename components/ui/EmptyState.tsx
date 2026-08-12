import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  /** The one thing there is to do from here — "browse the shop", "find a master". */
  actionLabel?: string;
  actionHref?: string;
  tone?: 'blue' | 'amber' | 'emerald';
  /**
   * `inline` drops the card chrome for the case where this already sits inside a panel —
   * a bordered card nested in a bordered card reads as a rendering mistake.
   */
  variant?: 'card' | 'inline';
}

const TONE: Record<NonNullable<EmptyStateProps['tone']>, { tile: string; ring: string; button: string }> = {
  blue: {
    tile: 'from-blue-500 to-sky-500 shadow-blue-500/25',
    ring: 'bg-blue-500/10',
    button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25',
  },
  amber: {
    tile: 'from-amber-500 to-orange-600 shadow-amber-500/25',
    ring: 'bg-amber-500/10',
    button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25',
  },
  emerald: {
    tile: 'from-emerald-500 to-teal-600 shadow-emerald-500/25',
    ring: 'bg-emerald-500/10',
    button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25',
  },
};

/**
 * What a page shows when it has nothing to show.
 *
 * Every list in the app had its own version of this and most of them were a line of
 * 12px grey text on a white slab — `/orders` with no orders rendered a blank band
 * between the header and the footer, which reads as a page that failed to load rather
 * than an account with no orders yet. One component, so the answer is the same
 * everywhere: say what is missing, and offer the one action that fills it.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  tone = 'blue',
  variant = 'card',
}: EmptyStateProps) {
  const t = TONE[tone];
  const inline = variant === 'inline';

  return (
    <div
      className={
        inline
          ? 'px-6 py-10 text-center'
          : 'relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-14 sm:py-16 text-center'
      }
    >
      {!inline && (
        <div className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full ${t.ring} blur-3xl`} />
      )}
      <div className="relative flex flex-col items-center gap-4">
        <div
          className={
            inline
              ? 'w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center'
              : `w-16 h-16 rounded-3xl bg-gradient-to-br ${t.tile} text-white flex items-center justify-center shadow-lg`
          }
        >
          <Icon name={icon} size={inline ? 22 : 28} />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className={`font-extrabold text-slate-900 dark:text-white ${inline ? 'text-sm' : 'text-lg'}`}>{title}</h3>
          {description && (
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              {description}
            </p>
          )}
        </div>
        {actionLabel && actionHref && (
          <Button
            asChild
            className={cn('mt-1 h-auto gap-2 px-5 py-3 rounded-2xl text-white text-xs font-extrabold shadow-lg', t.button)}
          >
            <Link href={actionHref}>
              {actionLabel}
              <Icon name="arrowright" size={14} />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

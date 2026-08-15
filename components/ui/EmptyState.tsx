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

/** `tile` is the same tinted-glyph recipe the dashboard's `AccentIcon` uses: a soft
    gradient fill, a hairline ring, and the icon in the tone's own ink. A solid block of
    saturated colour was the loudest thing on a screen whose whole message is "there is
    nothing here yet". */
const TONE: Record<NonNullable<EmptyStateProps['tone']>, { tile: string; ring: string; button: string }> = {
  blue: {
    tile: 'from-blue-500/15 to-blue-500/[0.04] ring-blue-500/20 text-blue-600 dark:from-blue-400/20 dark:to-blue-400/[0.06] dark:ring-blue-400/25 dark:text-blue-300',
    ring: 'bg-blue-500/10',
    button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25',
  },
  amber: {
    tile: 'from-amber-500/18 to-amber-500/[0.05] ring-amber-500/25 text-amber-600 dark:from-amber-400/20 dark:to-amber-400/[0.06] dark:ring-amber-400/25 dark:text-amber-300',
    ring: 'bg-amber-500/10',
    button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25',
  },
  emerald: {
    tile: 'from-emerald-500/15 to-emerald-500/[0.04] ring-emerald-500/20 text-emerald-600 dark:from-emerald-400/20 dark:to-emerald-400/[0.06] dark:ring-emerald-400/25 dark:text-emerald-300',
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

  /**
   * Inline is a single row, not a smaller card.
   *
   * A stacked icon-title-description block inside a panel gave every empty list the
   * height of a full one, so a cabinet with nothing pending rendered three enormous
   * white boxes with a sentence floating in the middle of each. An empty list should
   * take up as much room as it has to say.
   */
  if (inline) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
          <Icon name={icon} size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className={cn('shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white', t.button)}
          >
            {actionLabel}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center sm:py-16 dark:border-slate-800 dark:bg-slate-900">
      <div className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full ${t.ring} blur-3xl`} />
      <div className="relative flex flex-col items-center gap-4">
        <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset', t.tile)}>
          <Icon name={icon} size={28} />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h3>
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

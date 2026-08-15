'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type HeadingAccent = 'blue' | 'amber' | 'violet' | 'emerald';

const ACCENT: Record<HeadingAccent, string> = {
  blue: 'text-blue-600 dark:text-sky-400',
  amber: 'text-amber-600 dark:text-amber-400',
  violet: 'text-violet-600 dark:text-violet-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
};

/**
 * The heading every section on the landing page opens with — a coloured eyebrow over a
 * large tight title — brought inside the cabinet.
 *
 * The dashboards had been labelling their sections with a 10px grey caption, so the
 * public pages read as a designed product and the signed-in half read as an admin tool
 * bolted to the side of it. Same rhythm on both sides of the login now.
 */
export function SectionHeading({
  eyebrow,
  EyebrowIcon,
  title,
  description,
  accent = 'blue',
  action,
  href,
  hrefLabel,
  className,
}: {
  eyebrow: string;
  /** Small glyph before the eyebrow, the way the feed's section badges carry one. */
  EyebrowIcon?: LucideIcon;
  title: string;
  description?: string;
  accent?: HeadingAccent;
  action?: React.ReactNode;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col justify-between gap-4 sm:flex-row sm:items-end', className)}>
      <div className="min-w-0">
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest', ACCENT[accent])}>
          {EyebrowIcon && <EyebrowIcon size={13} />}
          {eyebrow}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>

      {action ??
        (href ? (
          <Link
            href={href}
            className={cn(
              'group inline-flex shrink-0 items-center gap-1 text-sm font-bold hover:underline',
              ACCENT[accent],
            )}
          >
            {hrefLabel}
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null)}
    </div>
  );
}

export default SectionHeading;

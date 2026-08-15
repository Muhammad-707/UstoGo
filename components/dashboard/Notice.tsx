'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CircleAlert,
  CircleCheck,
  Info,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

export type NoticeTone = 'info' | 'warning' | 'danger' | 'success';

const TONE: Record<NoticeTone, { box: string; chip: string; title: string; body: string; Icon: LucideIcon }> = {
  info: {
    box: 'bg-blue-50/70 dark:bg-blue-500/[0.07]',
    chip: 'text-blue-500 dark:text-sky-400',
    title: 'text-blue-900 dark:text-sky-200',
    body: 'text-blue-800/80 dark:text-sky-300/70',
    Icon: Info,
  },
  warning: {
    box: 'bg-amber-50/80 dark:bg-amber-500/[0.08]',
    chip: 'text-amber-500',
    title: 'text-amber-900 dark:text-amber-200',
    body: 'text-amber-800/80 dark:text-amber-300/70',
    Icon: AlertTriangle,
  },
  danger: {
    box: 'bg-rose-50/80 dark:bg-rose-500/[0.08]',
    chip: 'text-rose-500',
    title: 'text-rose-900 dark:text-rose-200',
    body: 'text-rose-800/80 dark:text-rose-300/70',
    Icon: CircleAlert,
  },
  success: {
    box: 'bg-emerald-50/80 dark:bg-emerald-500/[0.08]',
    chip: 'text-emerald-500',
    title: 'text-emerald-900 dark:text-emerald-200',
    body: 'text-emerald-800/80 dark:text-emerald-300/70',
    Icon: CircleCheck,
  },
};

interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children?: React.ReactNode;
  Icon?: LucideIcon;
  /** The single thing there is to do about it. */
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

/**
 * One shape for every "you should know this" strip in the cabinet.
 *
 * The overview alone stacked three of these written three different ways — a red
 * slab, a blue slab and an amber slab, each with its own padding, icon size and
 * type weight. Read together they looked like three bugs rather than one status
 * area, so they are one component with a tone.
 */
export function Notice({
  tone = 'info',
  title,
  children,
  Icon,
  actionLabel,
  actionHref,
  className,
}: NoticeProps) {
  const t = TONE[tone];
  const Glyph = Icon ?? t.Icon;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        t.box,
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Glyph size={17} strokeWidth={1.75} className={cn('mt-px shrink-0', t.chip)} />
        <div className="min-w-0 space-y-0.5">
          {title && <p className={cn('text-[13.5px] font-semibold leading-snug', t.title)}>{title}</p>}
          {children && <p className={cn('text-[13px] leading-relaxed', t.body)}>{children}</p>}
        </div>
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className={cn(
            'shrink-0 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition hover:shadow-md dark:bg-slate-800',
            t.title,
          )}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export default Notice;

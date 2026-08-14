'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

export interface ChartPoint {
  date: string;
  created: number;
  completed: number;
}

/** `2026-08-14` → `08-14`, which is all the axis has room for. */
function shortDate(date: string): string {
  return date.slice(5);
}

/**
 * Daily bookings, created against completed.
 *
 * Drawn by hand rather than with a chart library because it is two series over ~30
 * points and the page already ships enough JavaScript. The parts that matter:
 *
 *  - **One scale for both series.** Measuring each against its own maximum would be two
 *    charts stacked in the same box, and the taller one would always look like the
 *    busier one regardless of the numbers.
 *  - **A zero day draws nothing.** The previous version floored every bar at 4% height,
 *    so an empty day rendered a visible stub and the whole chart read as a flat line
 *    with a few random spikes instead of as mostly-quiet days with real peaks.
 *  - **The hover target is the whole column**, not the bar. Hovering a 10px bar to read
 *    a number is a game; hovering anywhere in the day is not.
 */
export function BookingsChart({ series }: { series: ChartPoint[] }) {
  const t = useTranslations('dashboardAdmin');
  const [hovered, setHovered] = useState<number | null>(null);

  const max = useMemo(
    () => Math.max(...series.flatMap((s) => [s.created, s.completed]), 1),
    [series]
  );

  const totals = useMemo(
    () => ({
      created: series.reduce((sum, s) => sum + s.created, 0),
      completed: series.reduce((sum, s) => sum + s.completed, 0),
    }),
    [series]
  );

  // At 30 points every label collides; show roughly eight along the axis.
  const labelEvery = Math.max(1, Math.ceil(series.length / 8));
  const active = hovered !== null ? series[hovered] : null;

  return (
    <div className="space-y-5">
      <div className="relative">
        {/* Gridlines, so a bar's height reads as a number and not only as taller-than. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56">
          {[1, 0.5, 0].map((f) => (
            <div key={f} className="absolute inset-x-0 flex items-center gap-2" style={{ top: `${(1 - f) * 100}%` }}>
              <span className="w-6 shrink-0 text-right text-[10px] font-bold text-slate-300 tabular-nums dark:text-slate-600">
                {Math.round(max * f)}
              </span>
              <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        <div className="relative ml-8 flex h-56 items-end" onMouseLeave={() => setHovered(null)}>
          {series.map((point, idx) => {
            const isHovered = hovered === idx;
            return (
              <div
                key={point.date}
                onMouseEnter={() => setHovered(idx)}
                className="group relative flex h-full flex-1 cursor-default items-end justify-center gap-[3px] px-[1px]"
              >
                {/* Full-height hover band — the affordance is the day, not the bar. */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-0 inset-x-0 rounded-md transition-colors duration-150',
                    isHovered ? 'bg-slate-100/80 dark:bg-slate-800/50' : 'bg-transparent'
                  )}
                />

                <div
                  style={{ height: point.created === 0 ? 0 : `${(point.created / max) * 100}%` }}
                  className={cn(
                    'relative w-full max-w-[9px] rounded-t-[3px] bg-gradient-to-t from-violet-600 to-indigo-400 transition-opacity duration-150',
                    hovered !== null && !isHovered && 'opacity-40'
                  )}
                />
                <div
                  style={{ height: point.completed === 0 ? 0 : `${(point.completed / max) * 100}%` }}
                  className={cn(
                    'relative w-full max-w-[9px] rounded-t-[3px] bg-gradient-to-t from-emerald-600 to-teal-400 transition-opacity duration-150',
                    hovered !== null && !isHovered && 'opacity-40'
                  )}
                />
              </div>
            );
          })}

          {/* Tooltip. Positioned along the axis by index, kept *inside* the plot area
              (floating it above the chart made it overlap the cards in the row above),
              and flipped past the halfway point so it never runs off the right edge. */}
          {active && hovered !== null && (
            <div
              className="pointer-events-none absolute top-2 z-20 w-max rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95"
              style={{
                left: `${((hovered + 0.5) / series.length) * 100}%`,
                transform: `translateX(${hovered > series.length / 2 ? 'calc(-100% - 8px)' : '8px'})`,
              }}
            >
              <p className="text-[11px] font-extrabold text-slate-900 tabular-nums dark:text-white">{active.date}</p>
              <div className="mt-1.5 space-y-1">
                <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-t from-violet-600 to-indigo-400" />
                  {t('chartCreated')}
                  <span className="ml-auto pl-3 font-extrabold text-slate-900 tabular-nums dark:text-white">
                    {active.created}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-t from-emerald-600 to-teal-400" />
                  {t('chartCompleted')}
                  <span className="ml-auto pl-3 font-extrabold text-slate-900 tabular-nums dark:text-white">
                    {active.completed}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Axis */}
      <div className="ml-8 flex border-t border-slate-100 pt-2 dark:border-slate-800">
        {series.map((point, idx) => (
          <span
            key={point.date}
            className={cn(
              'flex-1 text-center text-[9px] font-bold tabular-nums transition-colors',
              hovered === idx ? 'text-slate-900 dark:text-white' : 'text-slate-400'
            )}
          >
            {idx % labelEvery === 0 || hovered === idx ? shortDate(point.date) : ''}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        {[
          { label: t('chartTotalCreated'), value: totals.created },
          { label: t('chartTotalCompleted'), value: totals.completed },
          { label: t('chartPeak'), value: max },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-xl font-extrabold text-slate-900 tabular-nums dark:text-white">{s.value}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase leading-snug tracking-wider text-slate-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookingsChart;

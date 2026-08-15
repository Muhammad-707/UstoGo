'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, CalendarRange, Coins, Flame, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import type { MasterStats } from '@/lib/api/types';
import { useDateFormat } from '@/lib/datetime';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

/** API days are bare `YYYY-MM-DD`; read them as UTC so a positive timezone offset does
    not shift every bar one day to the left. */
const asDate = (day: string) => new Date(`${day}T00:00:00Z`);

/**
 * The three guide rules, and the fraction of the peak each one stands for.
 *
 * The percentages are the same ones the plot is drawn against — 9% of headroom top and
 * bottom — so the labels sit exactly on their lines instead of near them.
 */
const AXIS_ROWS = [
  { pct: 9, fraction: 1 },
  { pct: 50, fraction: 0.5 },
  { pct: 91, fraction: 0 },
] as const;

/** Axis figures are read at a glance, not audited: no currency, no decimals, and
    thousands collapsed, so "1250" does not push the plot 40px to the right. */
function axisAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(value));
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson).
 *
 * A plain Catmull-Rom spline through takings that sit at zero for twelve days and spike
 * once overshoots below the baseline on the way in and out — the curve draws negative
 * earnings the master never had. This one is guaranteed not to overshoot, so the line
 * only ever claims what the data says.
 */
function monotonePath(pts: readonly { x: number; y: number }[]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0].x},${pts[0].y}`;
  if (n === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    slope[i] = (pts[i + 1].y - pts[i].y) / dx[i];
  }

  const tan: number[] = new Array(n);
  tan[0] = slope[0];
  tan[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      tan[i] = 0;
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      tan[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
    }
  }

  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i];
    const c1x = pts[i].x + h / 3;
    const c1y = pts[i].y + (tan[i] * h) / 3;
    const c2x = pts[i + 1].x - h / 3;
    const c2y = pts[i + 1].y - (tan[i + 1] * h) / 3;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${pts[i + 1].x.toFixed(2)},${pts[i + 1].y.toFixed(2)}`;
  }
  return d;
}

/** One supporting figure under the headline: an icon, a caption, a value. */
function Fact({
  Icon,
  label,
  value,
  accent,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-900/[0.07] bg-white/70 px-3.5 py-3 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', accent)}>
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-[15px] font-bold leading-tight tracking-[-0.02em] text-slate-900 tabular-nums dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * Fourteen days of takings, as the page's one loud figure.
 *
 * The total used to sit at the very bottom of the page under a row of bars, which is the
 * wrong end of a cabinet a master opens to answer "how am I doing". Up here it gets the
 * display size the number deserves.
 *
 * The trend line beside it is a real chart and not a decoration: it carries a baseline,
 * a dated axis, a marked best day and a value for every point you hover. What it replaces
 * drew a bare stroke on a flat blue block with no scale of any kind, so a single 50 TJS
 * day rendered as a giant triangle across the whole card — a shape that looked like data
 * while telling you nothing. Anything that cannot be read off the chart (average per day,
 * best day, how many days actually earned) is stated in words underneath instead of being
 * left for the eye to guess.
 */
export function EarningsSpotlight({
  stats,
  loading,
  className,
}: {
  stats: MasterStats | null;
  loading: boolean;
  className?: string;
}) {
  const t = useTranslations('dashboardMaster');
  const { money } = useMoney();
  const fmt = useDateFormat();
  const [active, setActive] = useState<number | null>(null);

  const daily = useMemo(() => stats?.dailyEarnings ?? [], [stats]);

  const chart = useMemo(() => {
    const values = daily.map((d) => Number(d.total) || 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const max = Math.max(...values, 0);
    const scale = max > 0 ? max : 1;

    // 9% of headroom top and bottom: pinned to the exact edges, the peak's stroke is
    // clipped by the tile and the baseline merges into the card's own border.
    const points = values.map((v, i) => ({
      x: values.length === 1 ? 50 : (i / (values.length - 1)) * 100,
      y: 91 - (v / scale) * 82,
    }));

    const half = Math.floor(values.length / 2);
    const previous = values.slice(0, half).reduce((a, b) => a + b, 0);
    const recent = values.slice(half).reduce((a, b) => a + b, 0);

    return {
      values,
      points,
      max,
      sum,
      earningDays: values.filter((v) => v > 0).length,
      bestIndex: max > 0 ? values.indexOf(max) : -1,
      average: values.length > 0 ? sum / values.length : 0,
      // No baseline to compare against is not a 100% rise — it is simply unknown.
      delta: previous > 0 ? ((recent - previous) / previous) * 100 : null,
    };
  }, [daily]);

  const rising = (chart.delta ?? 0) >= 0;
  const ready = !loading && !!stats;
  const hasEarnings = ready && chart.max > 0;
  const activeDay = active !== null ? daily[active] : undefined;

  /**
   * The plot is drawn in real pixels, not on a 0–100 box stretched with
   * `preserveAspectRatio="none"`.
   *
   * Stretching is the cheap way to make an SVG fill a container and it breaks two things
   * at once: circles come out as ellipses, and a dash pattern — which is what a
   * `pathLength` draw-on animation compiles to — is measured along the *unstretched*
   * path, so the finished line renders in pieces with gaps between them. Measuring the
   * box costs one ResizeObserver and every coordinate below is then honest.
   */
  const plotRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  const pixels = chart.points.map((p) => ({ x: (p.x / 100) * box.w, y: (p.y / 100) * box.h }));
  const drawable = box.w > 0 && box.h > 0 && pixels.length > 1;
  const linePath = drawable ? monotonePath(pixels) : '';
  const areaPath = drawable ? `${linePath} L${box.w.toFixed(2)},${box.h} L0,${box.h} Z` : '';

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      className={cn(
        'relative isolate overflow-hidden rounded-[28px] border shadow-xl',
        'border-blue-200/70 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50 shadow-blue-900/[0.07]',
        'dark:border-white/10 dark:from-[#070B20] dark:via-[#0C1233] dark:to-[#08091C] dark:shadow-black/40',
        className,
      )}
    >
      {/* The glow. Same aurora in both themes, dialled down in light mode so it reads as
          a tint on a bright card rather than as a second, darker card. */}
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-600/40"
      />
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -bottom-48 -right-16 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl dark:bg-fuchsia-600/[0.18]"
        style={{ animationDelay: '1.4s' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-1/3 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/25"
      />
      {/* Engineering grid, the one thing that reads as "instrument" rather than "poster". */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(99,102,241,0.10) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(99,102,241,0.10) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 78%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent dark:via-cyan-300/70"
      />

      <div className="relative grid gap-7 p-6 sm:p-8 lg:grid-cols-12 lg:gap-9">
        {/* The figure */}
        <div className="flex flex-col lg:col-span-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-700 dark:border-cyan-300/25 dark:bg-cyan-400/10 dark:text-cyan-200">
              <TrendingUp size={12} strokeWidth={2.6} />
              {t('revenue14Days')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {t('revenueLive')}
            </span>
          </div>

          {!ready ? (
            <Skeleton className="mt-4 h-14 w-56 rounded-2xl" />
          ) : (
            <p className="mt-4 bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-700 bg-clip-text text-[clamp(1.9rem,3.2vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-transparent tabular-nums dark:from-white dark:via-cyan-100 dark:to-indigo-200">
              {money(stats!.totalEarnings)}
            </p>
          )}

          {ready && chart.delta !== null && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-bold tabular-nums',
                  rising
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                )}
              >
                {rising ? <ArrowUpRight size={13} strokeWidth={2.6} /> : <ArrowDownRight size={13} strokeWidth={2.6} />}
                {Math.abs(chart.delta).toFixed(0)}%
              </span>
              <span className="text-[12.5px] text-slate-500 dark:text-slate-400">{t('revenueVsPrev')}</span>
            </div>
          )}

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 lg:gap-2.5">
            <Fact
              Icon={Coins}
              accent="bg-blue-600/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
              label={t('revenueAvgPerDay')}
              value={ready ? money(chart.average) : '—'}
            />
            <Fact
              Icon={Flame}
              accent="bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-200"
              label={t('revenueBestDay')}
              value={
                hasEarnings
                  ? `${money(chart.max)} · ${fmt.date(asDate(daily[chart.bestIndex].date))}`
                  : '—'
              }
            />
            <Fact
              Icon={CalendarRange}
              accent="bg-violet-600/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
              label={t('revenueActiveDays')}
              value={ready ? t('revenueDaysOf', { count: chart.earningDays, total: chart.values.length }) : '—'}
            />
          </div>
        </div>

        {/* The chart. Centred in its column rather than pinned to the top: the facts
            beside it run taller, and a chart hanging off the ceiling with 80px of empty
            card under it is the thing that made the old one look like a placeholder. */}
        <div className="flex flex-col justify-center lg:col-span-7">
          {!ready ? (
            <Skeleton className="h-[236px] w-full rounded-2xl" />
          ) : (
            <div className="relative">
              {/* A scale, and the amount each rule stands for. Three guide lines with no
                  figures against them tell you the shape of a fortnight and nothing about
                  its size — 50 somoni and 50,000 draw exactly the same picture. */}
              <div className="flex gap-2">
                <div className="relative h-[200px] w-14 shrink-0 sm:h-[224px]">
                  {AXIS_ROWS.map(({ pct, fraction }) => (
                    <span
                      key={pct}
                      className="absolute right-0 -translate-y-1/2 text-right text-[10.5px] font-semibold text-slate-400 tabular-nums dark:text-slate-500"
                      style={{ top: `${pct}%` }}
                    >
                      {axisAmount(chart.max * fraction)}
                    </span>
                  ))}
                </div>

              <div
                ref={plotRef}
                className="relative h-[200px] min-w-0 flex-1 sm:h-[224px]"
                onMouseLeave={() => setActive(null)}
              >
                {/* Baseline and two guide rules — without them the stroke floats and any
                    peak looks the same size as any other. */}
                {AXIS_ROWS.map(({ pct }) => (
                  <div
                    key={pct}
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute inset-x-0 border-t',
                      pct === 91
                        ? 'border-slate-900/15 dark:border-white/20'
                        : 'border-dashed border-slate-900/[0.08] dark:border-white/10',
                    )}
                    style={{ top: `${pct}%` }}
                  />
                ))}
                {drawable && (
                  <svg
                    viewBox={`0 0 ${box.w} ${box.h}`}
                    width={box.w}
                    height={box.h}
                    aria-hidden
                    className="absolute inset-0"
                  >
                    <defs>
                      <linearGradient id="spotlight-stroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="50%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <linearGradient id="spotlight-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.42" />
                        <stop offset="60%" stopColor="#6366f1" stopOpacity="0.10" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <path d={areaPath} fill="url(#spotlight-fill)" />
                    <motion.path
                      d={linePath}
                      fill="none"
                      stroke="url(#spotlight-stroke)"
                      strokeWidth={2.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                      style={{ filter: 'drop-shadow(0 0 5px rgba(99,102,241,0.55))' }}
                    />
                  </svg>
                )}

                {/* Dots and hover targets stay in HTML: they need to be pointer targets
                    and to carry Tailwind's own theme-aware ring colours, neither of which
                    an SVG circle does as cleanly. */}
                {chart.points.map((p, i) => {
                  const isBest = i === chart.bestIndex;
                  const isActive = i === active;
                  const value = chart.values[i];
                  return (
                    <div
                      key={daily[i]?.date ?? i}
                      className="absolute top-0 bottom-0 -translate-x-1/2"
                      style={{ left: `${p.x}%`, width: `${100 / Math.max(chart.points.length - 1, 1)}%` }}
                      onMouseEnter={() => setActive(i)}
                    >
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-blue-500/50 to-transparent dark:via-cyan-300/60"
                        />
                      )}
                      <span
                        aria-hidden
                        className={cn(
                          'absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200',
                          isActive
                            ? 'h-3 w-3 bg-white ring-[3px] ring-blue-600 dark:ring-cyan-300'
                            : isBest
                              ? 'h-2.5 w-2.5 bg-white ring-2 ring-amber-500'
                              : value > 0
                                ? 'h-2 w-2 bg-white ring-2 ring-indigo-500/70'
                                : 'h-1.5 w-1.5 bg-slate-400/50 dark:bg-white/25',
                        )}
                        style={{ top: `${p.y}%` }}
                      />
                    </div>
                  );
                })}

                {/* Value readout for the hovered day. Pinned to the top of the plot so it
                    never covers the point it describes. */}
                {activeDay && (
                  <div
                    className={cn(
                      'pointer-events-none absolute top-0 z-10 rounded-xl border border-slate-900/10 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md dark:border-white/15 dark:bg-slate-900/95',
                      active! < 2 ? '' : active! > chart.points.length - 3 ? '-translate-x-full' : '-translate-x-1/2',
                    )}
                    style={{ left: `${chart.points[active!].x}%` }}
                  >
                    <p className="whitespace-nowrap text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {fmt.date(asDate(activeDay.date))}
                    </p>
                    <p className="whitespace-nowrap text-[14px] font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {money(activeDay.total)}
                    </p>
                  </div>
                )}

                {!hasEarnings && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <p className="rounded-full border border-slate-900/10 bg-white/80 px-4 py-1.5 text-[12.5px] font-semibold text-slate-500 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                      {t('revenueNone')}
                    </p>
                  </div>
                )}
              </div>
              </div>

              {/* A dated axis. The old card had none, which is what let one spike read as
                  a mountain range rather than as "the 11th". Each label is pinned to its
                  own point's x rather than laid out in equal flex columns — those two
                  are not the same position, and a tick that sits a few pixels off the
                  dot it belongs to is worse than no tick at all. The left inset matches
                  the value gutter so the ticks line up with the plot, not with the card. */}
              <div className="relative mt-2 ml-[calc(3.5rem+0.5rem)] h-4">
                {daily.map((d, i) => (
                  <span
                    key={d.date}
                    className={cn(
                      'absolute -translate-x-1/2 text-[10.5px] font-semibold tabular-nums transition-colors',
                      i === active
                        ? 'text-blue-700 dark:text-cyan-200'
                        : i === chart.bestIndex
                          ? 'text-amber-600 dark:text-amber-300'
                          : 'text-slate-400 dark:text-slate-600',
                    )}
                    style={{ left: `${chart.points[i].x}%` }}
                  >
                    {asDate(d.date).getUTCDate()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default EarningsSpotlight;

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Crown, LayoutGrid, MapPin, Search, ShieldCheck, TrendingUp, X } from 'lucide-react';

import { categoriesApi, mastersApi } from '@/lib/api/endpoints';
import type { Category, MasterPublic } from '@/lib/api/types';
import { CATEGORIES_HERO_IMAGE, CATEGORIES_HERO_INSET } from '@/lib/categoryVisuals';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

import { CategoryCard } from '@/components/categories/CategoryCard';
import { AnimatedCard, AnimatedGrid, FilterButton, FilterContainer } from '@/components/ui/FilterAnimate';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

type Filter = 'all' | 'popular' | 'luxury';

function flattenLeafCategories(categories: Category[]): Category[] {
  const out: Category[] = [];
  const walk = (list: Category[]) => {
    for (const c of list) {
      if (c.isLeaf) out.push(c);
      if (c.children?.length) walk(c.children);
    }
  };
  walk(categories);
  return out;
}

/**
 * Diacritic- and case-insensitive, so typing "чубин" still matches "чӯбин" — the
 * Tajik letters ӯ/ҳ/ҷ/қ/ғ are exactly the ones a phone keyboard makes awkward, and a
 * search that misses them is a search nobody uses.
 */
const COMBINING_MARKS = /\p{Diacritic}/gu;

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize('NFD').replace(COMBINING_MARKS, '');
}

function CategoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-5 pt-9">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function CategoriesClient() {
  const t = useTranslations('categories');
  const tc = useTranslations('common');
  const { perHour } = useMoney();

  const [categories, setCategories] = useState<Category[]>([]);
  const [allMasters, setAllMasters] = useState<MasterPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    categoriesApi
      .tree()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    mastersApi
      .search({ limit: 100 })
      .then((res) => {
        if (!cancelled) setAllMasters(res.items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const leafCategories = useMemo(() => flattenLeafCategories(categories), [categories]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; minPrice: number | null }>();
    for (const m of allMasters) {
      const price = m.priceFrom ? Number(m.priceFrom) : null;
      for (const name of m.categories) {
        const stat = map.get(name) ?? { count: 0, minPrice: null };
        stat.count += 1;
        if (price !== null && (stat.minPrice === null || price < stat.minPrice)) stat.minPrice = price;
        map.set(name, stat);
      }
    }
    return map;
  }, [allMasters]);

  const cityCount = useMemo(
    () => new Set(allMasters.map((m) => m.cityName).filter(Boolean)).size,
    [allMasters]
  );

  // The real Category type has no popular/luxury flags. "Popular" is approximated from
  // categories that have at least one master; "luxury" from a higher-than-average min price.
  const avgMinPrice = useMemo(() => {
    const prices = [...categoryStats.values()].map((s) => s.minPrice).filter((p): p is number => p !== null);
    return prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  }, [categoryStats]);

  const isPopular = (c: Category) => (categoryStats.get(c.name)?.count ?? 0) > 0;
  const isLuxury = (c: Category) => (categoryStats.get(c.name)?.minPrice ?? 0) > avgMinPrice;

  /**
   * Ribbons are ranked, not thresholded — the filters above use "has a master" and
   * "priced above average", and by those rules roughly every card in the catalogue
   * earns a badge, which makes the badge mean nothing. Three of each is a highlight.
   */
  const highlighted = useMemo(() => {
    const entries = leafCategories
      .map((c) => ({ id: c.id, stat: categoryStats.get(c.name) }))
      .filter((e): e is { id: string; stat: { count: number; minPrice: number | null } } => Boolean(e.stat));

    const premium = new Set(
      entries
        .filter((e) => e.stat.minPrice !== null)
        .sort((a, b) => (b.stat.minPrice ?? 0) - (a.stat.minPrice ?? 0))
        .slice(0, 3)
        .map((e) => e.id)
    );
    const popular = new Set(
      entries
        .filter((e) => e.stat.count > 0 && !premium.has(e.id))
        .sort((a, b) => b.stat.count - a.stat.count)
        .slice(0, 3)
        .map((e) => e.id)
    );
    return { premium, popular };
  }, [leafCategories, categoryStats]);

  const displayedCategories = useMemo(() => {
    const needle = normalize(query.trim());
    return leafCategories.filter((c) => {
      if (filter === 'popular' && !isPopular(c)) return false;
      if (filter === 'luxury' && !isLuxury(c)) return false;
      if (!needle) return true;
      return normalize(`${c.name} ${c.description ?? ''}`).includes(needle);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafCategories, categoryStats, avgMinPrice, filter, query]);

  const filtersActive = filter !== 'all' || query.trim() !== '';

  const FILTERS: { key: Filter; label: string; Icon: typeof LayoutGrid }[] = [
    { key: 'all', label: t('filterAll', { count: leafCategories.length }), Icon: LayoutGrid },
    { key: 'popular', label: t('filterPopular'), Icon: TrendingUp },
    { key: 'luxury', label: t('filterLuxury'), Icon: Crown },
  ];

  const HERO_STATS: { value: string; label: string; Icon: typeof LayoutGrid }[] = [
    { value: `${leafCategories.length}`, label: t('statCategories'), Icon: LayoutGrid },
    { value: `${allMasters.length}+`, label: t('statMasters'), Icon: ShieldCheck },
    { value: `${cityCount || 1}`, label: t('statCities'), Icon: MapPin },
  ];

  return (
    <div className="pb-24">

      {/* 1. HERO — copy on the left, artwork on the right.
             The page used to open with a dark construction photo bled edge to edge and
             the headline set in white on top of it: the text fought the picture, and on
             a light-mode site the whole first screen went black. Now the type sits on
             the page's own background where it is simply readable, and the photography
             gets its own frame beside it. */}
      <section className="relative isolate overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15" />
        <div className="absolute -bottom-48 right-1/3 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/10" />

        <div className="relative page-shell grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">

          {/* Left — copy, search, numbers */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/70 dark:text-sky-300">
              {t('badge')}
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl xl:text-6xl dark:text-white">
              {t('title')}
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
              {t('subtitle')}
            </p>

            {/* Search */}
            <div className="relative max-w-lg">
              <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="[&::-webkit-search-cancel-button]:appearance-none w-full rounded-2xl border border-slate-200 bg-white py-4 pl-14 pr-12 text-sm font-medium text-slate-900 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] outline-none transition placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('clearFilters')}
                  className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Numbers */}
            <div className="flex max-w-lg divide-x divide-slate-200 dark:divide-slate-800">
              {HERO_STATS.map((s, i) => (
                <div key={s.label} className={cn('flex-1', i === 0 ? 'pr-5' : 'px-5 last:pr-0')}>
                  <div className="flex items-baseline gap-1.5">
                    <s.Icon size={15} className="shrink-0 translate-y-px text-blue-600 dark:text-sky-400" />
                    <span className="text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                      {s.value}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold uppercase leading-snug tracking-wider text-slate-500 dark:text-slate-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — artwork */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.45)]">
              <img
                src={CATEGORIES_HERO_IMAGE}
                alt=""
                className="h-[440px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
            </div>

            {/* Craftsman inset, overlapping the main plate's lower-left corner. */}
            <div className="absolute -bottom-10 -left-10 w-56 overflow-hidden rounded-3xl border-[6px] border-white shadow-2xl dark:border-slate-950">
              <img src={CATEGORIES_HERO_INSET} alt="" className="h-36 w-full object-cover object-top" />
            </div>

            {/* Floating trust chip */}
            <div className="absolute -right-4 top-8 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                <ShieldCheck size={17} strokeWidth={2.3} />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">{allMasters.length}+</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('statMasters')}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FILTER BAR — sticks under the 72px navbar so the filters stay reachable
             while scrolling a twenty-card grid. */}
      <div className="sticky top-[72px] z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="page-shell flex items-center justify-between gap-4 py-3">
          <FilterContainer className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {FILTERS.map((f, idx) => (
              <FilterButton
                key={f.key}
                index={idx}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition',
                  filter === f.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-sky-400'
                )}
              >
                <f.Icon size={14} />
                {f.label}
              </FilterButton>
            ))}
          </FilterContainer>

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('resultsCount', { count: displayedCategories.length })}
            </span>
            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setQuery('');
                }}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50 dark:text-sky-400 dark:hover:bg-slate-900"
              >
                <X size={13} />
                {t('clearFilters')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. GRID */}
      <section className="page-shell py-12">
        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState icon="AlertTriangle" title={t('errorTitle')} description={t('errorDesc')} tone="amber" />
        )}

        {!loading && !error && displayedCategories.length === 0 && (
          <EmptyState
            icon="Search"
            title={t('noResultsTitle')}
            description={t('noResultsDesc')}
            actionLabel={filtersActive ? undefined : tc('viewAllMasters')}
            actionHref={filtersActive ? undefined : '/search'}
          />
        )}

        {/* AnimatedGrid is keyed on the filter pill only, not the query: re-running the
            whole cross-fade on every keystroke made typing feel like the page was
            reloading under you. */}
        {!loading && !error && displayedCategories.length > 0 && (
          <AnimatedGrid animKey={filter} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedCategories.map((cat, idx) => {
              const stat = categoryStats.get(cat.name);
              const tag = highlighted.premium.has(cat.id)
                ? { label: t('tagPremium'), className: 'bg-amber-400/95 text-amber-950' }
                : highlighted.popular.has(cat.id)
                  ? { label: t('tagPopular'), className: 'bg-white/90 text-slate-900' }
                  : null;

              return (
                <AnimatedCard key={cat.id} index={idx % 3}>
                  <CategoryCard
                    category={cat}
                    mastersCount={stat?.count ?? 0}
                    mastersLabel={t('verifiedMasters', { count: stat?.count ?? 0 })}
                    priceLabel={stat?.minPrice != null ? t('startingFrom', { price: perHour(stat.minPrice) }) : null}
                    tag={tag}
                  />
                </AnimatedCard>
              );
            })}
          </AnimatedGrid>
        )}
      </section>

      {/* 4. CTA */}
      <section className="page-shell">
        <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 p-8 text-white shadow-2xl shadow-blue-900/30 sm:p-14 md:flex-row">
          <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl animate-float" />
          <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl animate-float" style={{ animationDelay: '1s' }} />

          <div className="relative max-w-xl space-y-4 text-center md:text-left">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {tc('readyToUpgrade')}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{tc('ctaTitle')}</h2>
            <p className="text-sm leading-relaxed text-blue-100">{tc('ctaSubtitle')}</p>
          </div>

          <div className="relative flex w-full flex-col gap-4 sm:flex-row md:w-auto">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/booking"
                className="flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-center text-sm font-extrabold text-blue-900 shadow-xl transition hover:shadow-2xl hover:shadow-white/20"
              >
                {tc('bookService')}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/auth/register/master"
                className="block rounded-2xl border border-blue-400/40 bg-blue-900/60 px-8 py-4 text-center text-sm font-extrabold text-white transition hover:bg-blue-900/80"
              >
                {tc('becomeMaster')}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}

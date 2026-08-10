'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { categoriesApi, mastersApi } from '@/lib/api/endpoints';
import type { Category, MasterPublic } from '@/lib/api/types';
import { getCategoryVisual } from '@/lib/categoryVisuals';
import { FilterContainer, FilterButton, AnimatedGrid, AnimatedCard } from '@/components/ui/FilterAnimate';
import { useMoney } from '@/lib/money';

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

export default function CategoriesClient() {
  const t = useTranslations('categories');
  const { perHour } = useMoney();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allMasters, setAllMasters] = useState<MasterPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<'all' | 'popular' | 'luxury'>('all');

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

  // The real Category type has no popular/luxury flags. "Popular" is approximated from
  // categories that have at least one master; "luxury" from a higher-than-average min price.
  const avgMinPrice = useMemo(() => {
    const prices = [...categoryStats.values()].map((s) => s.minPrice).filter((p): p is number => p !== null);
    return prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  }, [categoryStats]);

  const displayedCategories = leafCategories.filter((c) => {
    const stat = categoryStats.get(c.name);
    if (filter === 'popular') return (stat?.count ?? 0) > 0;
    if (filter === 'luxury') return (stat?.minPrice ?? 0) > avgMinPrice;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
          {t('badge')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('title')}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          {t('subtitle')}
        </p>

        {/* Filter Pills */}
        <FilterContainer className="flex items-center justify-center gap-3 pt-4">
          <FilterButton
            index={0}
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t('filterAll', { count: leafCategories.length })}
          </FilterButton>
          <FilterButton
            index={1}
            onClick={() => setFilter('popular')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition ${
              filter === 'popular'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t('filterPopular')}
          </FilterButton>
          <FilterButton
            index={2}
            onClick={() => setFilter('luxury')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition ${
              filter === 'luxury'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t('filterLuxury')}
          </FilterButton>
        </FilterContainer>
      </div>

      {/* Loading / Error / Empty states */}
      {loading && (
        <div className="text-center py-16 text-sm text-slate-500 dark:text-slate-400 font-medium">
          Loading categories...
        </div>
      )}
      {!loading && error && (
        <div className="text-center py-16 text-sm text-slate-500 dark:text-slate-400 font-medium">
          Could not load categories. Please try again later.
        </div>
      )}
      {!loading && !error && displayedCategories.length === 0 && (
        <div className="text-center py-16 text-sm text-slate-500 dark:text-slate-400 font-medium">
          No categories found.
        </div>
      )}

      {/* Grid of Categories */}
      {!loading && !error && displayedCategories.length > 0 && (
        <AnimatedGrid animKey={filter} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCategories.map((cat, idx) => {
            const visual = getCategoryVisual(cat.slug);
            const stat = categoryStats.get(cat.name);
            return (
              <AnimatedCard key={cat.id} index={idx % 3}>
                <motion.div whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="h-full">
                <Link
                  href={`/search?category=${cat.id}`}
                  className="glass-card rounded-3xl p-8 group flex flex-col justify-between h-64 border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-shadow duration-300 hover:shadow-2xl"
                >
                  {/* Hover glow wash */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${visual.bgGradient} opacity-0 group-hover:opacity-60 dark:group-hover:opacity-20 transition-opacity duration-500`} />
                  {/* Decorative oversized icon ghost */}
                  <div className="absolute -right-6 -bottom-6 text-slate-900/[0.03] dark:text-white/[0.04] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                    <Icon name={visual.iconName} size={140} />
                  </div>

                  <div className="relative flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${visual.bgGradient} flex items-center justify-center text-blue-600 dark:text-sky-400 shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300`}>
                      <Icon name={visual.iconName} size={28} />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 dark:text-slate-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <Icon name="ArrowUpRight" size={16} />
                    </div>
                  </div>

                  <div className="relative space-y-2 mt-4">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="relative pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">{t('verifiedMasters', { count: stat?.count ?? 0 })}</span>
                    {stat?.minPrice != null && (
                      <span className="font-extrabold text-slate-900 dark:text-white">{t('startingFrom', { price: perHour(stat.minPrice) })}</span>
                    )}
                  </div>
                </Link>
                </motion.div>
              </AnimatedCard>
            );
          })}
        </AnimatedGrid>
      )}

    </div>
  );
}

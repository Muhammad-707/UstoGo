'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import type { Category, MasterPublic } from '@/lib/api/types';
import { getCategoryVisual } from '@/lib/categoryVisuals';
import { getAvatarUrl, getCoverUrl } from '@/lib/placeholders';

import HeroSlider from '@/components/layout/HeroSlider';
import { FilterItem } from '@/components/ui/FilterAnimate';

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

export default function LandingClient({
  categories,
  topMasters,
  allMasters,
}: {
  categories: Category[];
  topMasters: MasterPublic[];
  allMasters: MasterPublic[];
}) {
  const t = useTranslations('common');

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'popular'>('all');

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

  const displayedCategories = useMemo(() => {
    if (categoryFilter === 'popular') {
      return leafCategories.filter((c) => (categoryStats.get(c.name)?.count ?? 0) > 0);
    }
    return leafCategories;
  }, [leafCategories, categoryStats, categoryFilter]);

  return (
    <div className="space-y-24 pb-24 overflow-hidden">

      {/* 1. HERO SECTION (CINEMATIC FULLSCREEN SLIDER) */}
      <HeroSlider />

      {/* 2. STATS BAR SECTION */}
      <section className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 py-12 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">

          <FilterItem index={0} className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-sky-400">50,000+</div>
            <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">{t('completedJobs')}</p>
          </FilterItem>

          <FilterItem index={1} className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">1,420+</div>
            <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">{t('verifiedMasters')}</p>
          </FilterItem>

          <FilterItem index={2} className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400">4.95 / 5</div>
            <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">{t('avgRating')}</p>
          </FilterItem>

          <FilterItem index={3} className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-400">100%</div>
            <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">{t('insuranceGuarantee')}</p>
          </FilterItem>

        </div>
      </section>

      {/* 3. POPULAR CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              {t('browseServices')}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              {t('topCategories')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t('allServices')} ({leafCategories.length})
            </button>
            <button
              onClick={() => setCategoryFilter('popular')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                categoryFilter === 'popular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t('filterPopular')}
            </button>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {displayedCategories.slice(0, 10).map((cat, idx) => {
            const visual = getCategoryVisual(cat.slug);
            const stat = categoryStats.get(cat.name);
            return (
              <FilterItem key={cat.id} index={idx % 5}>
              <Link
                href={`/search?category=${cat.id}`}
                className="glass-card rounded-3xl p-6 group flex flex-col justify-between h-56 transition-all duration-300 relative overflow-hidden"
              >
                {/* Top Icon */}
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${visual.bgGradient} flex items-center justify-center text-blue-600 dark:text-sky-400 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon name={visual.iconName} size={24} />
                  </div>
                </div>

                {/* Text info */}
                <div className="space-y-1 mt-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-sky-400 transition">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>

                {/* Footer details */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>{stat?.count ?? 0} устоҳо</span>
                  {stat?.minPrice != null && (
                    <span className="font-extrabold text-slate-900 dark:text-white">Аз ${stat.minPrice}/h</span>
                  )}
                </div>
              </Link>
              </FilterItem>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-blue-500 transition shadow-sm"
          >
            <span>{t('exploreAllCategories', { count: leafCategories.length })}</span>
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>

      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section className="bg-slate-100/70 dark:bg-slate-900/50 py-20 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              {t('seamlessExp')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('howItWorks')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('howItWorksSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">

            {/* Step 1 */}
            <FilterItem index={0} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                01
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('step1Title')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('step1Desc')}
              </p>
            </FilterItem>

            {/* Step 2 */}
            <FilterItem index={1} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg relative">
              <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                02
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('step2Title')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('step2Desc')}
              </p>
            </FilterItem>

            {/* Step 3 */}
            <FilterItem index={2} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg relative">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                03
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('step3Title')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('step3Desc')}
              </p>
            </FilterItem>

          </div>

        </div>
      </section>

      {/* 5. TOP MASTERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              {t('verifiedExcellence')}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              {t('topRatedCraftsmen')}
            </h2>
          </div>

          <Link href="/search" className="text-sm font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1">
            <span>{t('viewAllMasters')}</span>
            <Icon name="ChevronRight" size={16} />
          </Link>
        </div>

        {/* Master Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topMasters.map((master, idx) => (
            <FilterItem key={master.id} index={idx % 3} className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
              {/* Cover Header */}
              <div className="h-32 relative">
                <img src={getCoverUrl(master.id)} alt={master.displayName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 text-xs font-bold flex items-center gap-1">
                  <Icon name="Star" size={14} className="fill-amber-400 text-amber-400" />
                  <span>{master.ratingAverage}</span>
                </div>
              </div>

              {/* Avatar & Content */}
              <div className="p-6 relative pt-0">
                <div className="-mt-12 flex items-end justify-between mb-4">
                  <div className="relative">
                    <img src={getAvatarUrl(master.id, master.displayName)} alt={master.displayName} className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl" />
                    {master.hasCertificates && (
                      <div className="absolute -bottom-1 -right-1 p-1 bg-blue-600 text-white rounded-full">
                        <Icon name="ShieldCheck" size={14} />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('hourlyRate')}</span>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {master.priceFrom ? `$${master.priceFrom}/h` : '—'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{master.displayName}</h3>
                  <p className="text-xs font-semibold text-blue-600 dark:text-sky-400">{master.cityName}</p>
                  {master.bio && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{master.bio}</p>
                  )}
                </div>

                {/* Skills tags */}
                {master.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {master.categories.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action CTA */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <Link
                    href={`/master/${master.id}`}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {t('viewDetails')}
                  </Link>
                  <Link
                    href={`/booking?master=${master.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-center text-xs font-bold shadow-md transition btn-ripple"
                  >
                    {t('bookNow')}
                  </Link>
                </div>

              </div>
            </FilterItem>
          ))}
        </div>

      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">

          <div className="max-w-xl space-y-4 text-center md:text-left">
            <span className="px-3 py-1 text-xs font-bold bg-white/20 rounded-full uppercase tracking-wider">
              {t('readyToUpgrade')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t('ctaTitle')}
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              {t('ctaSubtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              href="/booking"
              className="px-8 py-4 rounded-2xl bg-white text-blue-900 font-extrabold text-sm shadow-xl hover:bg-slate-100 transition text-center"
            >
              {t('bookService')}
            </Link>
            <Link
              href="/auth/register/master"
              className="px-8 py-4 rounded-2xl bg-blue-900/60 border border-blue-400/40 text-white font-extrabold text-sm hover:bg-blue-900/80 transition text-center"
            >
              {t('becomeMaster')}
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}

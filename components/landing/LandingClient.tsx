'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';

import { useMoney } from '@/lib/money';
import type { Category, MasterPublic } from '@/lib/api/types';
import { getAvatarUrl, getCoverUrl } from '@/lib/placeholders';

import { CategoryCard } from '@/components/categories/CategoryCard';
import HeroSlider from '@/components/layout/HeroSlider';
import { SITE_STAT_DEFS, StatBand } from '@/components/stats/StatBand';
import { FilterItem } from '@/components/ui/FilterAnimate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  const { perHour } = useMoney();
  const tCategories = useTranslations('categories');

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
    <div className="space-y-14 overflow-hidden pb-14 sm:space-y-24 sm:pb-24">

      {/* 1. HERO SECTION (CINEMATIC FULLSCREEN SLIDER) */}
      <HeroSlider /> 

      {/* 2. STATS BAR SECTION
             Nothing behind the cards on purpose. This band used to stack a gradient
             wash, three blurred colour orbs and two 48px grid patterns behind four
             tinted cards — five layers of decoration competing with the only thing
             here that carries information. The cards sit on the page. */}
      <section className="py-4">
        <StatBand
          className="page-shell"
          items={SITE_STAT_DEFS.map((s) => ({ ...s, label: t(s.labelKey) }))}
        />
      </section>

      {/* 3. POPULAR CATEGORIES SECTION */}
      <section className="page-shell space-y-5 sm:space-y-8">

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              {t('browseServices')}
            </span>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {t('topCategories')}
            </h2>
          </div>

          <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1">
            <Button size="raw" variant="ghost"
              onClick={() => setCategoryFilter('all')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition sm:px-4 ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t('allServices')} ({leafCategories.length})
            </Button>
            <Button size="raw" variant="ghost"
              onClick={() => setCategoryFilter('popular')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition sm:px-4 ${
                categoryFilter === 'popular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t('filterPopular')}
            </Button>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-5">
          {displayedCategories.slice(0, 10).map((cat, idx) => {
            const stat = categoryStats.get(cat.name);
            return (
              <FilterItem key={cat.id} index={idx % 5}>
                <CategoryCard
                  variant="compact"
                  category={cat}
                  mastersCount={stat?.count ?? 0}
                  mastersLabel={tCategories('verifiedMasters', { count: stat?.count ?? 0 })}
                  priceLabel={stat?.minPrice != null ? tCategories('startingFrom', { price: perHour(stat.minPrice) }) : null}
                />
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
      <section className="border-y border-slate-200/80 bg-slate-100/70 py-12 sm:py-20 dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="page-shell space-y-10 sm:space-y-16">

          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              {t('seamlessExp')}
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {t('howItWorks')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('howItWorksSub')}
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-4 sm:gap-8 md:grid-cols-3">

            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-14 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-blue-300 via-sky-300 to-emerald-300 dark:from-blue-800 dark:via-sky-800 dark:to-emerald-800" />

            {[
              { n: '01', titleKey: 'step1Title', descKey: 'step1Desc', color: 'bg-blue-600', shadow: 'shadow-blue-600/30', ring: 'group-hover:shadow-blue-500/30' },
              { n: '02', titleKey: 'step2Title', descKey: 'step2Desc', color: 'bg-sky-500', shadow: 'shadow-sky-500/30', ring: 'group-hover:shadow-sky-400/30' },
              { n: '03', titleKey: 'step3Title', descKey: 'step3Desc', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/30', ring: 'group-hover:shadow-emerald-400/30' },
            ].map((step, idx) => (
              <FilterItem key={step.n} index={idx}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`group relative bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3.5 sm:space-y-4 shadow-lg hover:shadow-2xl ${step.ring} transition-shadow duration-300 h-full`}
                >
                  <div className="relative w-14 h-14">
                    <motion.div
                      className={`absolute -inset-2 rounded-2xl ${step.color} blur-lg`}
                      animate={{ opacity: [0.15, 0.6, 0.15] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.4 }}
                    />
                    <div className={`relative z-10 w-14 h-14 rounded-2xl ${step.color} text-white font-extrabold text-xl flex items-center justify-center shadow-lg ${step.shadow} group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                      {step.n}
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl dark:text-white">{t(step.titleKey)}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t(step.descKey)}
                  </p>
                </motion.div>
              </FilterItem>
            ))}

          </div>

        </div>
      </section>

      {/* 5. TOP MASTERS SECTION */}
      <section className="page-shell space-y-5 sm:space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              {t('verifiedExcellence')}
            </span>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {t('topRatedCraftsmen')}
            </h2>
          </div>

          <Link href="/search" className="text-sm font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1">
            <span>{t('viewAllMasters')}</span>
            <Icon name="ChevronRight" size={16} />
          </Link>
        </div>

        {/* Master Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {topMasters.map((master, idx) => (
            <FilterItem key={master.id} index={idx % 3}>
            <Card asChild>
              <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 group hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-sky-500/10 hover:border-blue-200 dark:hover:border-sky-900 transition-[box-shadow,border-color] duration-300"
            >
                {/* Cover Header */}
                <div className="relative h-24 overflow-hidden sm:h-32">
                  <img src={master.bannerUrl || getCoverUrl(master.id)} alt={master.displayName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 text-xs font-bold flex items-center gap-1">
                    <Icon name="Star" size={14} className="fill-amber-400 text-amber-400" />
                    <span>{master.ratingAverage}</span>
                  </div>
                </div>

                {/* Avatar & Content */}
                <div className="relative p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="-mt-10 mb-3.5 flex items-end justify-between sm:-mt-12 sm:mb-4">
                    <div className="relative">
                      <motion.div
                        className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 blur"
                        animate={{ opacity: [0.35, 0.85, 0.35] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.3 }}
                      />
                      <img src={master.avatarUrl || getAvatarUrl(master.id, master.displayName)} alt={master.displayName} className="relative h-16 w-16 rounded-2xl border-4 border-white object-cover shadow-xl transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20 dark:border-slate-900" />
                      {master.hasCertificates && (
                        <div className="absolute -bottom-1 -right-1 p-1 bg-blue-600 text-white rounded-full">
                          <Icon name="ShieldCheck" size={14} />
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('hourlyRate')}</span>
                      <p className="text-lg font-extrabold text-slate-900 sm:text-xl dark:text-white">
                        {master.priceFrom ? perHour(master.priceFrom) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">{master.displayName}</h3>
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
                  <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-3.5 sm:mt-6 sm:gap-3 sm:pt-4 dark:border-slate-800">
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
              </motion.div>
            </Card>
            </FilterItem>
          ))}
        </div>

      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section className="page-shell">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl p-6 text-white shadow-2xl shadow-blue-900/30 sm:p-14 md:flex-row md:gap-8">

          {/* Decorative glows + pattern */}
          <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl animate-float" />
          <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1.5px, transparent 1.5px)',
              backgroundSize: '22px 22px',
            }}
          />

          <div className="relative max-w-xl space-y-4 text-center md:text-left">
            <span className="px-3 py-1 text-xs font-bold bg-white/20 rounded-full uppercase tracking-wider">
              {t('readyToUpgrade')}
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              {t('ctaTitle')}
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              {t('ctaSubtitle')}
            </p>
          </div>

          <div className="relative flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/booking"
                className="block rounded-2xl bg-white px-6 py-3.5 text-center text-sm font-extrabold text-blue-900 shadow-xl transition hover:shadow-2xl hover:shadow-white/20 sm:px-8 sm:py-4"
              >
                {t('bookService')}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/auth/register/master"
                className="block rounded-2xl border border-blue-400/40 bg-blue-900/60 px-6 py-3.5 text-center text-sm font-extrabold text-white transition hover:bg-blue-900/80 sm:px-8 sm:py-4"
              >
                {t('becomeMaster')}
              </Link>
            </motion.div>
          </div>

        </div>
      </section>

    </div>
  );
}

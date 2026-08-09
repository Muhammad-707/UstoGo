'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import type { Category, MasterPublic } from '@/lib/api/types';
import { getCategoryVisual } from '@/lib/categoryVisuals';
import { getAvatarUrl, getCoverUrl } from '@/lib/placeholders';

import HeroSlider from '@/components/layout/HeroSlider';
import { FilterItem } from '@/components/ui/FilterAnimate';

const STATS = [
  { value: '50,000+', labelKey: 'completedJobs', icon: 'CheckCircle2', accent: 'text-sky-600 dark:text-sky-400', glow: 'shadow-sky-500/10 dark:shadow-sky-500/20', ring: 'from-sky-500/10 dark:from-sky-500/20', tint: 'from-sky-50 to-white dark:from-transparent dark:to-transparent', iconBg: 'bg-sky-100 dark:bg-white/10', border: 'border-sky-100 dark:border-white/10' },
  { value: '1,420+', labelKey: 'verifiedMasters', icon: 'ShieldCheck', accent: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-emerald-500/10 dark:shadow-emerald-500/20', ring: 'from-emerald-500/10 dark:from-emerald-500/20', tint: 'from-emerald-50 to-white dark:from-transparent dark:to-transparent', iconBg: 'bg-emerald-100 dark:bg-white/10', border: 'border-emerald-100 dark:border-white/10' },
  { value: '4.95 / 5', labelKey: 'avgRating', icon: 'Star', accent: 'text-amber-600 dark:text-amber-400', glow: 'shadow-amber-500/10 dark:shadow-amber-500/20', ring: 'from-amber-500/10 dark:from-amber-500/20', tint: 'from-amber-50 to-white dark:from-transparent dark:to-transparent', iconBg: 'bg-amber-100 dark:bg-white/10', border: 'border-amber-100 dark:border-white/10' },
  { value: '100%', labelKey: 'insuranceGuarantee', icon: 'ShieldCheck', accent: 'text-purple-600 dark:text-purple-400', glow: 'shadow-purple-500/10 dark:shadow-purple-500/20', ring: 'from-purple-500/10 dark:from-purple-500/20', tint: 'from-purple-50 to-white dark:from-transparent dark:to-transparent', iconBg: 'bg-purple-100 dark:bg-white/10', border: 'border-purple-100 dark:border-white/10' },
] as const;

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
    <div className="space-y-24 pb-24 overflow-hidden">

      {/* 1. HERO SECTION (CINEMATIC FULLSCREEN SLIDER) */}
      <HeroSlider /> 

      {/* 2. STATS BAR SECTION */}
      <section className="relative py-16 text-slate-900 dark:text-white shadow-xl dark:shadow-2xl overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Base gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-blue-900 dark:via-slate-950 dark:to-indigo-950" />
        {/* Ambient glow orbs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-sky-300/15 dark:bg-sky-500/20 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-purple-300/15 dark:bg-purple-500/20 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-200/10 dark:bg-emerald-500/10 blur-3xl" />
        {/* Faint grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(rgba(15,23,42,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.7) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((s, idx) => (
            <FilterItem key={s.labelKey} index={idx}>
              <motion.div
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`group relative h-full rounded-3xl p-5 sm:p-6 text-center bg-gradient-to-b ${s.tint} dark:bg-white/[0.04] border ${s.border} backdrop-blur-md shadow-lg ${s.glow} hover:shadow-xl hover:border-opacity-60 dark:hover:bg-white/[0.08] dark:hover:border-white/20 transition-all`}
              >
                <motion.div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-b ${s.ring} to-transparent`}
                  animate={{ opacity: [0.25, 0.9, 0.25] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.35 }}
                />
                <div className="relative space-y-1.5">
                  <div className={`mx-auto mb-2 w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center ${s.accent} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon name={s.icon} size={18} />
                  </div>
                  <div className={`text-2xl sm:text-4xl font-extrabold ${s.accent} tracking-tight`}>{s.value}</div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium uppercase tracking-wider">{t(s.labelKey)}</p>
                </div>
              </motion.div>
            </FilterItem>
          ))}
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
              <motion.div whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="h-full">
              <Link
                href={`/search?category=${cat.id}`}
                className="glass-card rounded-3xl p-6 group flex flex-col justify-between h-56 transition-all duration-300 relative overflow-hidden"
              >
                {/* Animated color wash */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${visual.bgGradient}`}
                  animate={{ opacity: [0.2, 0.75, 0.2] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.25 }}
                />
                {/* Decorative oversized icon ghost */}
                <div className="absolute -right-4 -bottom-4 text-slate-900/[0.03] dark:text-white/[0.04] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                  <Icon name={visual.iconName} size={112} />
                </div>

                {/* Top Icon */}
                <div className="relative flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${visual.bgGradient} flex items-center justify-center text-blue-600 dark:text-sky-400 shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300`}>
                    <Icon name={visual.iconName} size={24} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 dark:text-slate-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <Icon name="ArrowUpRight" size={16} />
                  </div>
                </div>

                {/* Text info */}
                <div className="relative space-y-1 mt-4">
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
                <div className="relative pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>{tCategories('verifiedMasters', { count: stat?.count ?? 0 })}</span>
                  {stat?.minPrice != null && (
                    <span className="font-extrabold text-slate-900 dark:text-white">{tCategories('startingFrom', { price: stat.minPrice })}</span>
                  )}
                </div>
              </Link>
              </motion.div>
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
                  className={`group relative bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg hover:shadow-2xl ${step.ring} transition-shadow duration-300 h-full`}
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
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{t(step.titleKey)}</h3>
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
            <FilterItem key={master.id} index={idx % 3}>
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 group hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-sky-500/10 hover:border-blue-200 dark:hover:border-sky-900 transition-[box-shadow,border-color] duration-300"
            >
              {/* Cover Header */}
              <div className="h-32 relative overflow-hidden">
                <img src={master.bannerUrl || getCoverUrl(master.id)} alt={master.displayName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
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
                    <motion.div
                      className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 blur"
                      animate={{ opacity: [0.35, 0.85, 0.35] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.3 }}
                    />
                    <img src={master.avatarUrl || getAvatarUrl(master.id, master.displayName)} alt={master.displayName} className="relative w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl group-hover:scale-105 transition-transform duration-300" />
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
            </motion.div>
            </FilterItem>
          ))}
        </div>

      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 rounded-3xl p-8 sm:p-14 text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">

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
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
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
                className="block px-8 py-4 rounded-2xl bg-white text-blue-900 font-extrabold text-sm shadow-xl hover:shadow-2xl hover:shadow-white/20 transition text-center"
              >
                {t('bookService')}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/auth/register/master"
                className="block px-8 py-4 rounded-2xl bg-blue-900/60 border border-blue-400/40 text-white font-extrabold text-sm hover:bg-blue-900/80 transition text-center"
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

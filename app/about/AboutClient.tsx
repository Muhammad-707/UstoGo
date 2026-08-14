'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { CircleCheckBig, Landmark, ShieldCheck, Wallet } from 'lucide-react';

import { getCategoryVisual } from '@/lib/categoryVisuals';
import { cn } from '@/lib/utils';
import { SITE_STAT_DEFS, StatBand } from '@/components/stats/StatBand';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=2400&q=90';
const MISSION_IMAGE = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1600&q=90';

/**
 * Six finished-work shots, borrowed from the category artwork so the page never shows
 * a photograph the rest of the product does not already stand behind. The first and
 * fourth take a double-width cell, which is what stops six equal squares reading as a
 * contact sheet.
 */
const GALLERY = [
  { slug: 'interior-design', span: 'col-span-2 row-span-2' },
  { slug: 'masonry', span: '' },
  { slug: 'painting', span: '' },
  { slug: 'carpentry', span: '' },
  { slug: 'plumbing', span: '' },
  { slug: 'electrical', span: 'col-span-2' },
] as const;

export default function AboutClient() {
  const t = useTranslations('about');
  const tc = useTranslations('common');

  return (
    <div className="pb-24 space-y-24 overflow-hidden">

      {/* 1. HERO */}
      <section className="relative h-[70vh] min-h-[480px] flex items-end overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

        <div className="relative page-shell pb-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl space-y-5"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-sky-300 text-xs font-bold uppercase tracking-wider">
              {t('badge')}
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
              {t('title')}
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
              {t('description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. STATS BAND
             It used to be pulled up 128px to overlap the hero photo, which only worked
             while each figure sat on its own opaque card. Without the cards the numbers
             would be black type on a dark photograph, so the band sits on the page. */}
      <section className="page-shell">
        <StatBand items={SITE_STAT_DEFS.map((s) => ({ ...s, label: tc(s.labelKey) }))} />
      </section>

      {/* 3. MISSION SPLIT SECTION */}
      <section className="page-shell">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FilterItem index={0}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <img src={MISSION_IMAGE} alt="" className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-full bg-blue-500/30 blur-3xl" />
            </div>
          </FilterItem>

          <FilterItem index={1} className="space-y-5">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              {t('missionBadge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {t('missionTitle')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('missionBody')}
            </p>
            <ul className="space-y-3 pt-2">
              {[t('missionPoint1'), t('missionPoint2'), t('missionPoint3')].map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <CircleCheckBig size={14} />
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </FilterItem>
        </div>
      </section>

      {/* 4. VALUES / FEATURE CARDS */}
      <section className="page-shell space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {t('valuesBadge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('valuesTitle')}
          </h2>
        </div>

        <FilterContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { titleKey: 'feature1Title', descKey: 'feature1Desc', Icon: ShieldCheck, tile: 'from-blue-600 to-sky-500 shadow-blue-500/25', wash: 'bg-blue-500/15' },
            { titleKey: 'feature2Title', descKey: 'feature2Desc', Icon: Landmark, tile: 'from-amber-500 to-orange-500 shadow-amber-500/25', wash: 'bg-amber-500/15' },
            { titleKey: 'feature3Title', descKey: 'feature3Desc', Icon: Wallet, tile: 'from-emerald-600 to-teal-500 shadow-emerald-500/25', wash: 'bg-emerald-500/15' },
          ].map((item, idx) => (
            <FilterItem key={item.titleKey} index={idx}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="group relative h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)] transition-shadow duration-300 hover:shadow-[0_32px_64px_-32px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
              >
                <div
                  className={cn(
                    'pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-90',
                    item.wash
                  )}
                />
                <div
                  className={cn(
                    'relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-1 ring-white/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110',
                    item.tile
                  )}
                >
                  <item.Icon size={25} strokeWidth={2.2} />
                </div>
                <h3 className="relative mt-6 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t(item.titleKey)}
                </h3>
                <p className="relative mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {t(item.descKey)}
                </p>
              </motion.div>
            </FilterItem>
          ))}
        </FilterContainer>
      </section>

      {/* 5. HOW IT WORKS — three steps on one rail. The copy already existed in the
             `common` namespace for the landing page; the promise on this page is only
             credible if the reader can see how it is kept. */}
      <section className="page-shell space-y-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {t('processBadge')}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {tc('howItWorks')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{tc('howItWorksSub')}</p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="absolute left-[16.5%] right-[16.5%] top-7 hidden h-px bg-gradient-to-r from-blue-300 via-sky-300 to-emerald-300 md:block dark:from-blue-800 dark:via-sky-800 dark:to-emerald-800" />

          {[
            { n: '01', titleKey: 'step1Title', descKey: 'step1Desc', tile: 'from-blue-600 to-sky-500 shadow-blue-600/30' },
            { n: '02', titleKey: 'step2Title', descKey: 'step2Desc', tile: 'from-sky-500 to-cyan-400 shadow-sky-500/30' },
            { n: '03', titleKey: 'step3Title', descKey: 'step3Desc', tile: 'from-emerald-500 to-teal-400 shadow-emerald-500/30' },
          ].map((step, idx) => (
            <FilterItem key={step.n} index={idx} className="relative text-center">
              <div
                className={cn(
                  'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-extrabold text-white shadow-lg ring-4 ring-slate-50 dark:ring-slate-950',
                  step.tile
                )}
              >
                {step.n}
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-slate-900 dark:text-white">{tc(step.titleKey)}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {tc(step.descKey)}
              </p>
            </FilterItem>
          ))}
        </div>
      </section>

      {/* 6. WORK GALLERY — the claim on this page is quality, and quality is the one
             thing a paragraph cannot demonstrate. */}
      <section className="page-shell space-y-10">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {t('galleryBadge')}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t('galleryTitle')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('gallerySub')}</p>
        </div>

        <FilterContainer className="grid auto-rows-[180px] grid-cols-2 gap-4 lg:grid-cols-4">
          {GALLERY.map((item, idx) => (
            <FilterItem key={item.slug} index={idx} className={cn('h-full', item.span)}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="group relative h-full overflow-hidden rounded-3xl shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-shadow duration-300 hover:shadow-[0_28px_56px_-28px_rgba(15,23,42,0.45)]"
              >
                <img
                  src={getCategoryVisual(item.slug).image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              </motion.div>
            </FilterItem>
          ))}
        </FilterContainer>
      </section>

      {/* 5. CTA */}
      <section className="page-shell">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 rounded-3xl p-8 sm:p-14 text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl animate-float" />
          <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl animate-float" style={{ animationDelay: '1s' }} />

          <div className="relative max-w-xl space-y-4 text-center md:text-left">
            <span className="px-3 py-1 text-xs font-bold bg-white/20 rounded-full uppercase tracking-wider">
              {tc('readyToUpgrade')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {tc('ctaTitle')}
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              {tc('ctaSubtitle')}
            </p>
          </div>

          <div className="relative flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/booking"
                className="block px-8 py-4 rounded-2xl bg-white text-blue-900 font-extrabold text-sm shadow-xl hover:shadow-2xl hover:shadow-white/20 transition text-center"
              >
                {tc('bookService')}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/auth/register/master"
                className="block px-8 py-4 rounded-2xl bg-blue-900/60 border border-blue-400/40 text-white font-extrabold text-sm hover:bg-blue-900/80 transition text-center"
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

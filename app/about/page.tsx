'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=2400&q=90';
const MISSION_IMAGE = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1600&q=90';

const STATS = [
  { value: '50,000+', labelKey: 'completedJobs', icon: 'CheckCircle2', accent: 'text-sky-400' },
  { value: '1,420+', labelKey: 'verifiedMasters', icon: 'ShieldCheck', accent: 'text-emerald-400' },
  { value: '4.95 / 5', labelKey: 'avgRating', icon: 'Star', accent: 'text-amber-400' },
  { value: '100%', labelKey: 'insuranceGuarantee', icon: 'ShieldCheck', accent: 'text-purple-400' },
] as const;

export default function AboutPage() {
  const t = useTranslations('about');
  const tc = useTranslations('common');

  return (
    <div className="pb-24 space-y-24 overflow-hidden">

      {/* 1. HERO */}
      <section className="relative h-[70vh] min-h-[480px] flex items-end overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
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

      {/* 2. STATS BAND */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <FilterContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((s, idx) => (
            <FilterItem key={s.labelKey} index={idx}>
              <motion.div
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="glass-card rounded-3xl p-5 sm:p-6 text-center border border-slate-200 dark:border-slate-800 h-full"
              >
                <div className={`mx-auto mb-2 w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${s.accent}`}>
                  <Icon name={s.icon} size={18} />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{s.value}</div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">{tc(s.labelKey)}</p>
              </motion.div>
            </FilterItem>
          ))}
        </FilterContainer>
      </section>

      {/* 3. MISSION SPLIT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    <Icon name="CheckCircle2" size={14} />
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </FilterItem>
        </div>
      </section>

      {/* 4. VALUES / FEATURE CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
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
            { titleKey: 'feature1Title', descKey: 'feature1Desc', icon: 'ShieldCheck', gradient: 'from-blue-500/10 to-sky-500/10', iconColor: 'text-blue-600 dark:text-sky-400' },
            { titleKey: 'feature2Title', descKey: 'feature2Desc', icon: 'Award', gradient: 'from-amber-500/10 to-orange-500/10', iconColor: 'text-amber-600 dark:text-amber-400' },
            { titleKey: 'feature3Title', descKey: 'feature3Desc', icon: 'DollarSign', gradient: 'from-emerald-500/10 to-teal-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          ].map((item, idx) => (
            <FilterItem key={idx} index={idx}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group relative bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden h-full"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className={`relative w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 ${item.iconColor} flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300`}>
                  <Icon name={item.icon} size={26} />
                </div>
                <h3 className="relative text-xl font-extrabold text-slate-900 dark:text-white">{t(item.titleKey)}</h3>
                <p className="relative text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t(item.descKey)}</p>
              </motion.div>
            </FilterItem>
          ))}
        </FilterContainer>
      </section>

      {/* 5. CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

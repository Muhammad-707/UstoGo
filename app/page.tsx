'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { CATEGORIES, MASTERS } from '@/lib/mockData';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LandingPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredCategories = selectedCategory === 'all' 
    ? CATEGORIES 
    : CATEGORIES.filter(c => c.popular);

  return (
    <div className="space-y-24 pb-24 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/15 via-sky-400/15 to-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-glow" />
        
        <div className="text-center max-w-4xl mx-auto space-y-8">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-sky-300 text-xs font-bold shadow-sm animate-fade-in">
            <Icon name="Sparkles" size={16} className="text-amber-500" />
            <span>{t('heroBadge')}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            {t('heroTitlePrefix')}{' '}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              {t('heroTitleHighlight')}
            </span>{' '}
            {t('heroTitleSuffix')}
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Search Bar Component */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-sky-400 rounded-3xl blur-md opacity-25 group-hover:opacity-50 transition duration-300" />
            <div className="relative flex flex-col sm:flex-row items-center bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-200 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-3 pl-4 flex-1 w-full">
                <Icon name="Search" size={22} className="text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full bg-transparent py-3 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href={`/search?q=${encodeURIComponent(searchQuery)}`}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition btn-ripple flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>{t('searchMasters')}</span>
                  <Icon name="ArrowRight" size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Tag Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2">
            <span className="font-semibold">{t('popular')}</span>
            {['Plumber', 'Electrician', 'AC Repair', 'Interior Designer', 'CCTV Setup'].map((tag) => (
              <Link
                key={tag}
                href={`/search?category=${encodeURIComponent(tag.toLowerCase())}`}
                className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-sky-400 transition"
              >
                {tag}
              </Link>
            ))}
          </div>

        </div>

        {/* Hero Visual Showcase Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Alex Morgan */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex items-center gap-4">
              <img src={MASTERS[0].avatar} alt={MASTERS[0].name} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{MASTERS[0].name}</h4>
                  <Icon name="ShieldCheck" size={16} className="text-blue-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{MASTERS[0].category}</p>
                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                  <Icon name="Star" size={14} className="fill-amber-400 text-amber-400" />
                  <span>{MASTERS[0].rating} ({MASTERS[0].reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">${MASTERS[0].hourlyRate}/hr</span>
              <Link href={`/master/${MASTERS[0].id}`} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                <span>{t('viewDetails')}</span>
                <Icon name="ChevronRight" size={14} />
              </Link>
            </div>
          </div>

          {/* Card 2: Sarah Jenkins */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden group border-2 border-blue-500/30">
            <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-extrabold uppercase">
              ★ Top Rated
            </div>
            <div className="flex items-center gap-4">
              <img src={MASTERS[2].avatar} alt={MASTERS[2].name} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{MASTERS[2].name}</h4>
                  <Icon name="ShieldCheck" size={16} className="text-blue-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{MASTERS[2].category}</p>
                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                  <Icon name="Star" size={14} className="fill-amber-400 text-amber-400" />
                  <span>{MASTERS[2].rating} ({MASTERS[2].reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">${MASTERS[2].hourlyRate}/hr</span>
              <Link href={`/master/${MASTERS[2].id}`} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                <span>{t('viewDetails')}</span>
                <Icon name="ChevronRight" size={14} />
              </Link>
            </div>
          </div>

          {/* Card 3: Marcus Vance */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex items-center gap-4">
              <img src={MASTERS[1].avatar} alt={MASTERS[1].name} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{MASTERS[1].name}</h4>
                  <Icon name="ShieldCheck" size={16} className="text-blue-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{MASTERS[1].category}</p>
                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                  <Icon name="Star" size={14} className="fill-amber-400 text-amber-400" />
                  <span>{MASTERS[1].rating} ({MASTERS[1].reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">${MASTERS[1].hourlyRate}/hr</span>
              <Link href={`/master/${MASTERS[1].id}`} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                <span>{t('viewDetails')}</span>
                <Icon name="ChevronRight" size={14} />
              </Link>
            </div>
          </div>

        </div>

      </section>

      {/* 2. STATS BAR SECTION */}
      <section className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 py-12 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-sky-400">50,000+</div>
            <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">{t('completedJobs')}</p>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">1,420+</div>
            <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">{t('verifiedMasters')}</p>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400">4.95 / 5</div>
            <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">{t('avgRating')}</p>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-400">100%</div>
            <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">{t('insuranceGuarantee')}</p>
          </div>

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
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t('allServices')} ({CATEGORIES.length})
            </button>
            <button
              onClick={() => setSelectedCategory('popular')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCategory === 'popular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t('popularOnly')}
            </button>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredCategories.slice(0, 10).map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.id}`}
              className="glass-card rounded-3xl p-6 group flex flex-col justify-between h-56 transition-all duration-300 relative overflow-hidden"
            >
              {/* Top Icon & Badge */}
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.bgGradient} flex items-center justify-center text-blue-600 dark:text-sky-400 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon name={cat.iconName} size={24} />
                </div>
                {cat.badge && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-[10px] font-extrabold uppercase">
                    {cat.badge}
                  </span>
                )}
              </div>

              {/* Text info */}
              <div className="space-y-1 mt-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-sky-400 transition">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {cat.description}
                </p>
              </div>

              {/* Footer details */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>{cat.masterCount} {t('mastersCount')}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{t('from')} ${cat.startingPrice}/h</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center pt-4">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-blue-500 transition shadow-sm"
          >
            <span>Explore All 15 Categories</span>
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
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                01
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('step1Title')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg relative">
              <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                02
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('step2Title')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg relative">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                03
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('step3Title')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('step3Desc')}
              </p>
            </div>

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
          {MASTERS.slice(0, 3).map((master) => (
            <div key={master.id} className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
              {/* Cover Header */}
              <div className="h-32 relative">
                <img src={master.coverImage} alt={master.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 text-xs font-bold flex items-center gap-1">
                  <Icon name="Star" size={14} className="fill-amber-400 text-amber-400" />
                  <span>{master.rating}</span>
                </div>
              </div>

              {/* Avatar & Content */}
              <div className="p-6 relative pt-0">
                <div className="-mt-12 flex items-end justify-between mb-4">
                  <div className="relative">
                    <img src={master.avatar} alt={master.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl" />
                    {master.verified && (
                      <div className="absolute -bottom-1 -right-1 p-1 bg-blue-600 text-white rounded-full">
                        <Icon name="ShieldCheck" size={14} />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('hourlyRate')}</span>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">${master.hourlyRate}/h</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{master.name}</h3>
                  <p className="text-xs font-semibold text-blue-600 dark:text-sky-400">{master.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{master.bio}</p>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {master.skills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {skill}
                    </span>
                  ))}
                </div>

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
            </div>
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
              Get Instant Quotes & Book Certified Craftsmen Today
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

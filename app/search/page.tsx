'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { CATEGORIES, MASTERS } from '@/lib/mockData';

export default function SearchMastersPage() {
  const t = useTranslations('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(4.0);
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredMasters = MASTERS.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || m.categoryId === selectedCategory;
    const matchesVerified = !verifiedOnly || m.verified;
    const matchesRating = m.rating >= minRating;
    const matchesPrice = m.hourlyRate <= maxPrice;

    return matchesSearch && matchesCategory && matchesVerified && matchesRating && matchesPrice;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header & Main Search */}
      <div className="space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('eyebrow')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('title')}
        </h1>

        {/* Search Bar */}
        <div className="relative max-w-3xl">
          <Icon name="Search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-md transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Icon name="X" size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Grid (Filter Sidebar + Master Cards Result Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filter Sidebar */}
        <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 h-fit shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Icon name="Filter" size={18} className="text-blue-600 dark:text-sky-400" />
              {t('filters')}
            </h3>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setVerifiedOnly(false);
                setMinRating(4.0);
                setMaxPrice(100);
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              {t('resetAll')}
            </button>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('category')}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">{t('allCategories', { count: CATEGORIES.length })}</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Verified Toggle */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('verifiedOnly')}</span>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
          </div>

          {/* Rating Filter */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('minRating')}</label>
            <div className="flex gap-2">
              {[4.0, 4.5, 4.8].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    minRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon name="Star" size={12} className="fill-amber-400 text-amber-400" />
                  {rating}+
                </button>
              ))}
            </div>
          </div>

          {/* Max Hourly Rate Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 uppercase tracking-wider">{t('maxRate')}</span>
              <span className="text-slate-900 dark:text-white">{t('perHour', { price: maxPrice })}</span>
            </div>
            <input
              type="range"
              min="20"
              max="150"
              step="5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Result Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Top Bar (Results Count + View Mode Switcher) */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {t.rich('showingResults', {
                count: filteredMasters.length,
                highlight: (chunks) => <span className="text-blue-600 dark:text-sky-400 font-extrabold">{chunks}</span>,
              })}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title={t('gridView')}
              >
                <Icon name="Grid" size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title={t('listView')}
              >
                <Icon name="Menu" size={18} />
              </button>
            </div>
          </div>

          {/* Master Cards Grid / List */}
          {filteredMasters.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400 mx-auto flex items-center justify-center">
                <Icon name="Search" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('noResultsTitle')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {t('noResultsDesc')}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMasters.map((m) => (
                <div key={m.id} className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col justify-between group">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <img src={m.avatar} alt={m.name} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{m.name}</h3>
                          <Icon name="ShieldCheck" size={16} className="text-blue-500" />
                        </div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-sky-400">{m.category}</p>
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                          <Icon name="Star" size={14} className="fill-amber-400" />
                          <span>{m.rating} ({m.reviewCount})</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {m.bio}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {m.skills.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                    <div className="flex items-center justify-between py-3 text-xs">
                      <span className="text-slate-400 font-medium">{m.location}</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">{t('perHour', { price: m.hourlyRate })}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Link
                        href={`/master/${m.id}`}
                        className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        {t('profile')}
                      </Link>
                      <Link
                        href={`/booking?master=${m.id}`}
                        className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-center text-xs font-bold shadow transition btn-ripple"
                      >
                        {t('bookNow')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMasters.map((m) => (
                <div key={m.id} className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <img src={m.avatar} alt={m.name} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{m.name}</h3>
                        <Icon name="ShieldCheck" size={18} className="text-blue-500" />
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                          {t('jobsDone', { count: m.completedJobs })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-blue-600 dark:text-sky-400">{m.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Icon name="Star" size={14} className="fill-amber-400" />
                          {m.rating} ({t('reviewsCount', { count: m.reviewCount })})
                        </span>
                        <span>• {m.distance}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('rate')}</span>
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">{t('perHour', { price: m.hourlyRate })}</span>
                    </div>

                    <Link
                      href={`/booking?master=${m.id}`}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition btn-ripple"
                    >
                      {t('bookNow')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

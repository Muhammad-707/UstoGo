'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { CATEGORIES } from '@/lib/mockData';

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const [filter, setFilter] = useState<'all' | 'popular' | 'luxury'>('all');

  const displayedCategories = CATEGORIES.filter((c) => {
    if (filter === 'popular') return c.popular;
    if (filter === 'luxury') return c.badge === 'Luxury' || c.startingPrice >= 50;
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
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t('filterAll', { count: CATEGORIES.length })}
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition ${
              filter === 'popular'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t('filterPopular')}
          </button>
          <button
            onClick={() => setFilter('luxury')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition ${
              filter === 'luxury'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t('filterLuxury')}
          </button>
        </div>
      </div>

      {/* Grid of All 15 Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/search?category=${cat.id}`}
            className="glass-card rounded-3xl p-8 group flex flex-col justify-between h-64 border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-all duration-300 hover:shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.bgGradient} flex items-center justify-center text-blue-600 dark:text-sky-400 group-hover:scale-110 transition duration-300`}>
                <Icon name={cat.iconName} size={28} />
              </div>
              {cat.badge && (
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-[10px] font-extrabold uppercase">
                  {cat.badge}
                </span>
              )}
            </div>

            <div className="space-y-2 mt-4">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{t('verifiedMasters', { count: cat.masterCount })}</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{t('startingFrom', { price: cat.startingPrice })}</span>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}

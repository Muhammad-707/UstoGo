'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { MASTERS } from '@/lib/mockData';

export default function FavoritesPage() {
  const t = useTranslations('favorites');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('badge')}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MASTERS.slice(0, 3).map((m) => (
          <div key={m.id} className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-4">
              <img src={m.avatar} alt={m.name} className="w-16 h-16 rounded-2xl object-cover" />
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{m.name}</h3>
                <p className="text-xs text-blue-600 dark:text-sky-400 font-semibold">{m.category}</p>
                <span className="text-xs text-amber-500 font-bold">★ {m.rating}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900 dark:text-white">{t('hourlyRate', { rate: `$${m.hourlyRate}` })}</span>
              <Link
                href={`/booking?master=${m.id}`}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
              >
                {t('bookService')}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

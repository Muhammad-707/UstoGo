'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';

export default function AboutPage() {
  const t = useTranslations('about');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
          {t('badge')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          {t('description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { titleKey: 'feature1Title', descKey: 'feature1Desc', icon: 'ShieldCheck' },
          { titleKey: 'feature2Title', descKey: 'feature2Desc', icon: 'Award' },
          { titleKey: 'feature3Title', descKey: 'feature3Desc', icon: 'DollarSign' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400 flex items-center justify-center">
              <Icon name={item.icon} size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t(item.titleKey)}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{t(item.descKey)}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

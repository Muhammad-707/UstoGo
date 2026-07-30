'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';

export default function ContactPage() {
  const t = useTranslations('contact');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('formTitle')}</h3>
          <form className="space-y-4">
            <input type="text" placeholder={t('namePlaceholder')} className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
            <input type="email" placeholder={t('emailPlaceholder')} className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
            <textarea rows={4} placeholder={t('messagePlaceholder')} className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
            <button className="w-full py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-lg btn-ripple">
              {t('submitButton')}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-lg">
            <h4 className="font-bold text-slate-900 dark:text-white">{t('headquartersTitle')}</h4>
            <p className="text-xs text-slate-500">{t('headquartersAddress')}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-lg">
            <h4 className="font-bold text-slate-900 dark:text-white">{t('hotlineTitle')}</h4>
            <p className="text-xs text-blue-600 dark:text-sky-400 font-bold">{t('hotlineNumber')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

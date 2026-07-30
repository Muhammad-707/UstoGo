'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function WorkingSchedulePage() {
  const t = useTranslations('settingsSchedule');
  const days = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('availabilityMatrix')}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('workingSchedule')}</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-xl">
        {days.map((day, idx) => (
          <div key={day} className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-900 dark:text-white text-sm">{day}</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">{idx < 5 ? '08:00 AM - 07:00 PM' : idx === 5 ? '09:00 AM - 05:00 PM' : t('emergencyOnly')}</span>
              <button className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {t('edit')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

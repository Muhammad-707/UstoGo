'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function MasterServicesPage() {
  const t = useTranslations('settingsServices');
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {t('catalogManagement')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('servicesPricing')}</h1>
        </div>
        <button className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-md">
          {t('addService')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
        {[
          { name: 'Smart Breaker Panel Upgrade', rate: '$45/hr', est: '2 - 3 hours' },
          { name: 'EV Charger Gen 3 Installation', rate: '$50/hr', est: '2 hours' },
          { name: 'Recessed LED Lighting Setup', rate: '$40/hr', est: '1 - 2 hours' },
        ].map((s, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</h3>
              <p className="text-slate-400">{t('estimatedDuration', { est: s.est })}</p>
            </div>
            <span className="font-extrabold text-blue-600 dark:text-sky-400 text-sm">{s.rate}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

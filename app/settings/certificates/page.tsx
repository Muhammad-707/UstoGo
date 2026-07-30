'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { MASTERS } from '@/lib/mockData';

export default function CertificatesPage() {
  const t = useTranslations('settingsCertificates');
  const certs = MASTERS[0].certificates;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('craftsmanVerification')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('certificatesLicenses')}</h1>
        </div>
        <button className="px-5 py-2.5 rounded-2xl bg-amber-600 text-white font-extrabold text-xs shadow-md">
          {t('addNewLicense')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xl overflow-hidden">
        {certs.map((c, idx) => (
          <div key={idx} className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Icon name="Award" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.title}</h3>
                <p className="text-xs text-slate-500">{t('issuerVerified', { issuer: c.issuer, year: c.year })}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">{t('verifiedActive')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

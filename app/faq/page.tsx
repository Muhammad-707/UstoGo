'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function FAQPage() {
  const t = useTranslations('faq');

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{t('title')}</h1>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-2 shadow-sm">
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full text-left font-bold text-slate-900 dark:text-white text-base flex justify-between items-center"
            >
              <span>{faq.q}</span>
              <span className="text-blue-600 font-extrabold">{openIdx === idx ? '−' : '+'}</span>
            </button>
            {openIdx === idx && (
              <p className="text-xs text-slate-500 leading-relaxed pt-2 animate-fade-in">{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

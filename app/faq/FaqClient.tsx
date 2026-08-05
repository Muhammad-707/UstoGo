'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';

export default function FaqClient() {
  const t = useTranslations('faq');

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
          {t('badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('title')}</h1>
      </div>

      <FilterContainer className="space-y-4">
        {faqs.map((faq, idx) => {
          const open = openIdx === idx;
          return (
            <FilterItem key={idx} index={idx}>
              <div
                className={`glass-card rounded-3xl border transition-colors duration-300 overflow-hidden ${
                  open ? 'border-blue-300 dark:border-sky-800 shadow-lg' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : idx)}
                  className="w-full text-left p-6 font-bold text-slate-900 dark:text-white text-base flex justify-between items-center gap-4 group"
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-extrabold transition-colors ${
                      open ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-950 group-hover:text-blue-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span>{faq.q}</span>
                  </span>
                  <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex-shrink-0 ${open ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400'}`}
                  >
                    <Icon name="ChevronDown" size={18} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pb-6 px-6 pl-[3.75rem]">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FilterItem>
          );
        })}
      </FilterContainer>
    </div>
  );
}

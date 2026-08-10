'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';

export default function ContactClient() {
  const t = useTranslations('contact');

  return (
    <div className="page-shell page-shell-narrow py-16 space-y-12">
      <FilterItem index={0} className="text-center space-y-3 max-w-xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
          <Icon name="MessageSquare" size={12} />
          {t('badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('title')}</h1>
      </FilterItem>

      <FilterContainer className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FilterItem index={0}>
          <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 h-full">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('formTitle')}</h3>
            <form className="space-y-4">
              <input type="text" placeholder={t('namePlaceholder')} className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
              <input type="email" placeholder={t('emailPlaceholder')} className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
              <textarea rows={4} placeholder={t('messagePlaceholder')} className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 btn-ripple transition"
              >
                {t('submitButton')}
              </motion.button>
            </form>
          </div>
        </FilterItem>

        <FilterItem index={1} className="space-y-6">
          {[
            { titleKey: 'headquartersTitle', bodyKey: 'headquartersAddress', icon: 'MapPin', color: 'from-blue-500/10 to-sky-500/10', iconColor: 'text-blue-600 dark:text-sky-400' },
            { titleKey: 'hotlineTitle', bodyKey: 'hotlineNumber', icon: 'MessageSquare', color: 'from-emerald-500/10 to-teal-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          ].map((item) => (
            <motion.div
              key={item.titleKey}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`relative overflow-hidden glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-60 dark:opacity-20`} />
              <div className={`relative w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 ${item.iconColor} flex items-center justify-center shadow-sm`}>
                <Icon name={item.icon} size={20} />
              </div>
              <h4 className="relative font-bold text-slate-900 dark:text-white">{t(item.titleKey)}</h4>
              <p className={`relative text-xs font-bold ${item.icon === 'MessageSquare' ? 'text-blue-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {t(item.bodyKey)}
              </p>
            </motion.div>
          ))}
        </FilterItem>
      </FilterContainer>
    </div>
  );
}

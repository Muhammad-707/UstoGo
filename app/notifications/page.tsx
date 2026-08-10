'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { notificationsApi } from '@/lib/api/endpoints';
import type { NotificationItem } from '@/lib/api/types';
import { FilterItem } from '@/components/ui/FilterAnimate';

export default function NotificationsPage() {
  const t = useTranslations('notifications');

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi
      .list({ limit: 30 })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleOpen = async (n: NotificationItem) => {
    if (n.isRead) return;
    try {
      await notificationsApi.markRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    } catch {
      // ignore
    }
  };

  const notificationTitle = (n: NotificationItem) =>
    (n.payload?.title as string | undefined) ?? n.type.replace(/_/g, ' ');
  const notificationMessage = (n: NotificationItem) =>
    (n.payload?.message as string | undefined) ?? '';

  return (
    <div className="page-shell page-shell-narrow py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white items-center justify-center shadow-lg shadow-blue-900/20">
            <Icon name="Bell" size={22} />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              {t('badge')}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">{t('title')}</h1>
          </div>
        </div>
        <button onClick={handleMarkAllRead} className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
          {t('markAllRead')}
        </button>
      </div>

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {loading && <div className="p-6 text-xs text-slate-400 font-semibold">{t('loading')}</div>}
        {!loading && items.length === 0 && (
          <div className="p-6 text-xs text-slate-400 font-semibold">{t('empty')}</div>
        )}
        {items.map((n, idx) => (
          <FilterItem key={n.id} index={idx}>
          <motion.div
            onClick={() => handleOpen(n)}
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`p-6 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
              n.isRead ? '' : 'bg-blue-50/40 dark:bg-blue-950/20'
            }`}
          >
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400 flex-shrink-0">
              <Icon name={n.type.includes('BOOKING') ? 'Clock' : n.type.includes('PROMO') ? 'Sparkles' : 'CheckCircle2'} size={20} />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{notificationTitle(n)}</h3>
                <span className="text-xs text-slate-400 flex-shrink-0">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{notificationMessage(n)}</p>
            </div>
            {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
          </motion.div>
          </FilterItem>
        ))}
      </div>
    </div>
  );
}

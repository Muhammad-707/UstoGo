'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { notificationsApi } from '@/lib/api/endpoints';
import { NOTIFICATION_TYPES, type NotificationItem } from '@/lib/api/types';
import { FilterItem } from '@/components/ui/FilterAnimate';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const tn = useTranslations('notificationTypes');
  const locale = useLocale();
  /** `tj` is not a language tag (Tajik is `tg`), so dates need the mapped one. */
  const intlLocale = ({ tj: 'tg-TJ', ru: 'ru-RU', en: 'en-US' } as Record<string, string>)[locale] ?? 'en-US';

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

  const notificationTitle = (n: NotificationItem) => {
    const fromPayload = n.payload?.title as string | undefined;
    if (fromPayload) return fromPayload;
    const known = (NOTIFICATION_TYPES as readonly string[]).includes(n.type);
    return known ? tn(n.type) : tn('fallback');
  };
  const notificationMessage = (n: NotificationItem) =>
    (n.payload?.message as string | undefined) ?? '';

  return (
    <>
    <ClientPageHeader
      icon="Bell"
      eyebrow={t('badge')}
      title={t('title')}
      action={
        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          {t('markAllRead')}
        </button>
      }
    />
    <div className="page-shell page-shell-narrow py-12 space-y-8">

      {!loading && items.length === 0 && (
        <EmptyState icon="Bell" title={t('empty')} description={t('emptyDesc')} />
      )}

      {/* The list is only drawn when there is one — an empty bordered shell around a
          single grey line reads as a component that failed rather than an empty inbox. */}
      {(loading || items.length > 0) && (
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {loading && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-2.5 w-2/3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
        {items.map((n, idx) => (
          <FilterItem key={n.id} index={idx}>
          <motion.div
            onClick={() => handleOpen(n)}
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
              n.isRead ? '' : 'bg-blue-50/40 dark:bg-blue-950/20'
            }`}
          >
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400 flex-shrink-0">
              <Icon name={n.type.includes('BOOKING') ? 'Clock' : n.type.includes('PROMO') ? 'Sparkles' : 'CheckCircle2'} size={20} />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{notificationTitle(n)}</h3>
                <span className="text-xs text-slate-400 flex-shrink-0">{new Date(n.createdAt).toLocaleString(intlLocale)}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{notificationMessage(n)}</p>
            </div>
            {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
          </motion.div>
          </FilterItem>
        ))}
      </div>
      )}
    </div>
    </>
  );
}

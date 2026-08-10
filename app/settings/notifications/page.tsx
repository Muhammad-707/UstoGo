'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { notificationsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { NotificationPreferences, NotificationType } from '@/lib/api/types';
import { PageHeader } from '@/components/layout/PageHeader';

const GROUPS: { key: string; icon: string; types: NotificationType[] }[] = [
  {
    key: 'groupBookings',
    icon: 'calendar',
    types: [
      'BOOKING_CREATED',
      'BOOKING_ACCEPTED',
      'BOOKING_REJECTED',
      'BOOKING_STARTED',
      'BOOKING_COMPLETED',
      'BOOKING_CANCELLED',
      'BOOKING_EXPIRED',
      'BOOKING_RESCHEDULED',
      'BOOKING_REMINDER',
    ],
  },
  {
    key: 'groupReviews',
    icon: 'star',
    types: ['REVIEW_RECEIVED', 'REVIEW_REPLIED', 'REVIEW_INVITATION'],
  },
  {
    key: 'groupMasterAccount',
    icon: 'briefcase',
    types: ['MASTER_REGISTERED', 'MASTER_APPROVED', 'MASTER_REJECTED', 'MASTER_DEACTIVATED'],
  },
  {
    key: 'groupMessagesQuotes',
    icon: 'message',
    types: ['MESSAGE_RECEIVED', 'QUOTE_REQUESTED', 'QUOTE_RESPONDED', 'QUOTE_DECLINED'],
  },
  {
    key: 'groupSystem',
    icon: 'bell',
    types: ['SYSTEM_ANNOUNCEMENT'],
  },
];

export default function NotificationPreferencesPage() {
  const t = useTranslations('settingsNotifications');

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<NotificationType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    notificationsApi
      .preferences()
      .then(setPreferences)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches preferences on mount
    load();
  }, [load]);

  const toggle = async (type: NotificationType) => {
    if (!preferences) return;
    const next = !preferences[type];
    setPreferences({ ...preferences, [type]: next });
    setSavingType(type);
    setError(null);
    try {
      const updated = await notificationsApi.updatePreferences([{ type, enabled: next }]);
      setPreferences(updated);
    } catch (err) {
      // revert on failure
      setPreferences((prev) => (prev ? { ...prev, [type]: !next } : prev));
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    } finally {
      setSavingType(null);
    }
  };

  return (
    <>
      <PageHeader icon="bell" eyebrow={t('accountSettings')} title={t('title')} hint={t('subtitle')} />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}
      {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}

      {preferences &&
        GROUPS.map((group) => (
          <div
            key={group.key}
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-1"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Icon name={group.icon} size={18} />
              {t(group.key)}
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {group.types.map((type) => {
                const enabled = preferences[type] ?? true;
                return (
                  <div key={type} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{t(`type.${type}`)}</p>
                    </div>
                    <button
                      onClick={() => toggle(type)}
                      disabled={savingType === type}
                      role="switch"
                      aria-checked={enabled}
                      className={`relative w-10 h-6 rounded-full shrink-0 transition disabled:opacity-60 ${
                        enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      <Link
        href="/settings/security"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <Icon name="key" size={14} />
        {t('backToSecurity')}
      </Link>
    </div>
    </>
  );
}

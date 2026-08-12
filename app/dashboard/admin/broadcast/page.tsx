'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { UserRole } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Audience = 'ALL' | UserRole;

const AUDIENCES: Audience[] = ['ALL', 'CLIENT', 'MASTER', 'ADMIN'];

export default function AdminBroadcastPage() {
  const t = useTranslations('adminBroadcast');
  useRequireAuth(['ADMIN']);

  const [audience, setAudience] = useState<Audience>('CLIENT');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);

  const canSend = title.trim().length > 0 && message.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    if (!window.confirm(t('confirmSend'))) return;
    setSending(true);
    setError(null);
    setSentCount(null);
    try {
      // SYSTEM_ANNOUNCEMENT is the one type meant for platform-wide messages; the
      // payload shape ({ title, message }) is what the notification list already renders.
      const res = await adminApi.broadcast({
        role: audience === 'ALL' ? undefined : audience,
        type: 'SYSTEM_ANNOUNCEMENT',
        payload: { title: title.trim(), message: message.trim() },
      });
      setSentCount(res?.recipients ?? 0);
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('sendFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title={t('title')}
      subtitle={t('subtitle')}
      action={
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold transition"
        >
          <Icon name="chevronleft" size={14} />
          {t('back')}
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500">{t('audienceLabel')}</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AUDIENCES.map((a) => (
                <Button size="raw" variant="ghost"
                  key={a}
                  onClick={() => setAudience(a)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition ${
                    audience === a
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t(`audience${a}`)}
                </Button>
              ))}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('titleLabel')}</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder={t('titlePlaceholder')}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('messageLabel')}</span>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder={t('messagePlaceholder')}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
            <span className="block text-right text-[10px] text-slate-400 font-bold">{message.length}/1000</span>
          </label>

          {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
          {sentCount !== null && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {t('sentOk', { count: sentCount })}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button size="raw" variant="ghost"
              onClick={handleSend}
              disabled={sending || !canSend}
              className="px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs font-extrabold shadow-lg shadow-purple-600/25 disabled:opacity-50 transition flex items-center gap-2"
            >
              <Icon name="bell" size={15} />
              {sending ? t('sending') : t('sendButton')}
            </Button>
            <p className="text-[10px] text-slate-400 font-semibold">{t('irreversibleHint')}</p>
          </div>
        </Card>

        {/* Live preview — exactly how the notification bell renders a payload. */}
        <div className="lg:col-span-2 space-y-3">
          <span className="text-xs font-bold text-slate-500">{t('previewLabel')}</span>
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 flex gap-3 items-start">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 mt-0.5 shrink-0">
                <Icon name="sparkles" size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 break-words">
                  {title.trim() || t('previewEmptyTitle')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 break-words whitespace-pre-line">
                  {message.trim() || t('previewEmptyMessage')}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">{t('previewJustNow')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

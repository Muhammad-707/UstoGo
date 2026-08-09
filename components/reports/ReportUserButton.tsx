'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { reportsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ReportType } from '@/lib/api/types';

const TYPES: ReportType[] = ['SPAM', 'FRAUD', 'ABUSE', 'OTHER'];

/**
 * The client-facing half of the moderation loop — admins already have
 * `/dashboard/admin/reports` to resolve what this creates. Hidden when the caller is
 * not logged in or would be reporting themselves.
 */
export function ReportUserButton({
  reportedUserId,
  className = '',
}: {
  reportedUserId: string;
  className?: string;
}) {
  const t = useTranslations('reportUser');
  const router = useRouter();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReportType>('SPAM');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (user?.id === reportedUserId) return null;

  const openModal = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setType('SPAM');
    setDescription('');
    setError(null);
    setSent(false);
    setOpen(true);
  };

  const submit = async () => {
    if (description.trim().length < 10) {
      setError(t('descriptionTooShort'));
      return;
    }
    setSending(true);
    setError(null);
    try {
      await reportsApi.create({ reportedUserId, type, description: description.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('sendFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-red-500 transition ${className}`}
      >
        <Icon name="filetext" size={13} />
        {t('reportButton')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Icon name="checkcircle2" size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('sentTitle')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('sentBody')}</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                >
                  {t('close')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('modalTitle')}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('modalSubtitle')}</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 shrink-0">
                    <Icon name="x" size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('typeLabel')}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setType(option)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition ${
                          type === option
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {t(`type${option}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('descriptionLabel')}</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder={t('descriptionPlaceholder')}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </label>

                {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={submit}
                    disabled={sending}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow disabled:opacity-60 transition"
                  >
                    {sending ? '...' : t('submitButton')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

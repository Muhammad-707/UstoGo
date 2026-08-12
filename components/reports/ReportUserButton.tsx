'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { reportsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ReportType } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
      <Button size="raw" variant="ghost"
        type="button"
        onClick={openModal}
        className={`inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-red-500 transition ${className}`}
      >
        <Icon name="filetext" size={13} />
        {t('reportButton')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={!sent} className="gap-5">
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Icon name="checkcircle2" size={22} />
                </div>
                <DialogHeader className="space-y-1 pr-0 text-center items-center">
                  <DialogTitle className="text-base">{t('sentTitle')}</DialogTitle>
                  <DialogDescription>{t('sentBody')}</DialogDescription>
                </DialogHeader>
                <DialogClose asChild>
                  <Button
                    variant="secondary"
                    className="h-auto px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
                  >
                    {t('close')}
                  </Button>
                </DialogClose>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>{t('modalTitle')}</DialogTitle>
                  <DialogDescription>{t('modalSubtitle')}</DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <Label>{t('typeLabel')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map((option) => (
                      <Button size="raw" variant="ghost"
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
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="report-description">{t('descriptionLabel')}</Label>
                  <Textarea
                    id="report-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder={t('descriptionPlaceholder')}
                    className="p-3 rounded-xl font-semibold"
                  />
                </div>

                {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="h-auto px-5 py-2.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {t('cancel')}
                    </Button>
                  </DialogClose>
                  <Button
                    variant="brand"
                    onClick={submit}
                    disabled={sending}
                    className="h-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 shadow-red-600/25 text-xs shadow"
                  >
                    {sending ? '...' : t('submitButton')}
                  </Button>
                </DialogFooter>
              </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}

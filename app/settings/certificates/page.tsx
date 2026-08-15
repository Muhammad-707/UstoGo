'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Award, Paperclip, Plus, X } from 'lucide-react';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import { uploadFile } from '@/lib/api/upload';
import type { Certificate } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { PageBody } from '@/components/layout/PageBody';
import { Panel } from '@/components/dashboard/Panel';
import { Notice } from '@/components/dashboard/Notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker, todayISO } from '@/components/ui/date-picker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export default function CertificatesPage() {
  const t = useTranslations('settingsCertificates');
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    masterCabinetApi
      .myCertificates()
      .then(setCerts)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const handleAdd = async () => {
    if (!title.trim()) {
      setError(t('validationTitle'));
      return;
    }
    setAdding(true);
    setError(null);
    try {
      let fileId: string | undefined;
      if (file) {
        fileId = await uploadFile(file, 'CERTIFICATE');
      }
      const created = await masterCabinetApi.addCertificate({
        title: title.trim(),
        issuer: issuer.trim() || undefined,
        issuedAt: issuedAt ? `${issuedAt}T00:00:00.000Z` : undefined,
        fileId,
      });
      setCerts((prev) => [...prev, created]);
      setTitle('');
      setIssuer('');
      setIssuedAt('');
      setFile(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('addFailed'));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    setError(null);
    try {
      await masterCabinetApi.removeCertificate(id);
      setCerts((prev) => prev.filter((x) => x.id !== id));
      revalidateMastersCache();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('removeFailed'));
    }
  };

  return (
    <>
    <MasterPageHeader
      icon="award"
      eyebrow={t('craftsmanVerification')}
      title={t('certificatesLicenses')}
      hint={t('certificateHint')}
      action={
        <Button
          onClick={() => setShowForm((s) => !s)}
          className="h-auto gap-1.5 px-5 py-2.5 rounded-2xl bg-slate-900 text-[13px] font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus size={14} strokeWidth={2.6} />
          {t('addNewLicense')}
        </Button>
      }
    />
    <PageBody narrow>

      {error && <Notice tone="danger">{error}</Notice>}

      {showForm && (
        <Panel
          title={t('addNewLicense')}
          Icon={Award}
          accent="blue"
          divided
          className="border-blue-200/90 dark:border-blue-900/50"
          bodyClassName="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <Input
              placeholder={t('titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-3 rounded-xl font-semibold"
            />
            <Input
              placeholder={t('issuerPlaceholder')}
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="p-3 rounded-xl font-semibold"
            />
            <DatePicker
              value={issuedAt}
              onChange={setIssuedAt}
              max={todayISO()}
              aria-label={t('issuedAtLabel')}
              className="p-3 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-3 text-xs">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="h-auto gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-blue-950/40"
            >
              <Paperclip size={13} />
              {file ? file.name : t('uploadFile')}
            </Button>
            {file && <span className="text-[10px] font-bold text-emerald-600">{t('fileAttached')}</span>}
          </div>
          <Button
            variant="brand"
            onClick={handleAdd}
            disabled={adding}
            className="h-auto px-5 py-2.5 rounded-2xl bg-slate-900 text-[13px] font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {adding ? t('saving') : t('addNewLicense')}
          </Button>
        </Panel>
      )}

      <Panel
        title={t('myCertificatesTitle')}
        Icon={Award}
        accent="blue"
        divided
        padding="none"
        action={
          certs.length > 0 ? (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {certs.length}
            </span>
          ) : undefined
        }
      >
        {loading && (
          <div className="space-y-3 p-5 sm:p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        )}
        {!loading && certs.length === 0 && (
          <EmptyState
            variant="inline"
            icon="award"
            title={t('noCertificates')}
            description={t('noCertificatesDesc')}
          />
        )}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {certs.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:px-6 dark:hover:bg-slate-800/30"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-sky-400">
                  <Award size={20} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{c.title}</h3>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {t('issuerVerified', {
                      issuer: c.issuer ?? '—',
                      year: c.issuedAt ? new Date(c.issuedAt).getFullYear() : '—',
                    })}
                  </p>
                  {c.fileId && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {t('fileAttached')}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(c.id)}
                className="shrink-0 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
              >
                <X size={17} />
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </PageBody>
    </>
  );
}
